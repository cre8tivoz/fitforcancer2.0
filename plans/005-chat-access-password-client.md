# Plan 005: Make the optional chat access password actually usable by the client

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat c3c6355..HEAD -- api/gemini.ts services/geminiService.ts SECURITY.md`
> `api/gemini.ts` is also edited by plans 003/004/006 — check `plans/README.md`
> for what landed and re-locate the excerpt below before assuming conflict.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW (feature is dormant unless the env var is set; default public mode must remain byte-identical in behavior)
- **Depends on**: plans/001-test-baseline-vitest.md, plans/004-durable-rate-limiting.md (same-file ordering)
- **Category**: bug / security
- **Planned at**: commit `c3c6355`, 2026-06-11

## Why this matters

`SECURITY.md` documents an optional chat access gate: set `CHAT_ACCESS_PASSWORD` (or `FFC_CHAT_ACCESS_PASSWORD`) and "clients must send `x-chat-access-password`". The server enforces this — but no client code anywhere sends that header, and there is no UI to enter a password. Enabling the env var therefore bricks the chat for every user with a permanent "Chat access is restricted" error and no recovery path. Separately, the server compares the password with `!==`, a non-constant-time comparison. This plan adds a minimal client flow (prompt on 401, remember in sessionStorage, retry once) and a constant-time comparison server-side.

## Current state

- `api/gemini.ts` — the gate:

  ```ts
  // api/gemini.ts:246-253
  const configuredAccessPassword = process.env.CHAT_ACCESS_PASSWORD || process.env.FFC_CHAT_ACCESS_PASSWORD;
  if (configuredAccessPassword) {
    const providedAccessPassword = getHeaderValue(req.headers, "x-chat-access-password");
    if (providedAccessPassword !== configuredAccessPassword) {
      res.status(401).json({ error: "Chat access is restricted" });
      return;
    }
  }
  ```

- `services/geminiService.ts` (30 lines, full file read at planning time) — sends only `Content-Type`; on `!response.ok` it returns the server's `error` string, which the UI renders as a normal assistant chat bubble:

  ```ts
  // services/geminiService.ts:5-25
  export const getGeminiResponse = async (history: ChatMessage[], context?: ChatContext) => {
    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ history, context, cancerType: context?.cancerType }),
      });

      const data = await parseJson(response);

      if (!response.ok) {
        return data?.error || "There was an error connecting to the health assistant. ...";
      }

      return data?.text || "I'm sorry, I couldn't generate a response. Please try again.";
  ```

- `SECURITY.md:12-15` — documents the gate and the header name.
- Caller: `App.tsx:495` (`const aiResponse = await getGeminiResponse(newMessages, context);`) — signature must not change.
- The api directory runs on Node (full `node:crypto` available). Conventions: double quotes in `api/`/`services`, arrow-function exports.

## Commands you will need

| Purpose   | Command        | Expected on success |
|-----------|----------------|---------------------|
| Typecheck | `npm run lint` | exit 0              |
| Tests     | `npm test`     | all pass            |
| Build     | `npm run build`| exit 0              |

## Scope

**In scope** (the only files you should modify or create):
- `api/gemini.ts` (only the access-gate block)
- `services/geminiService.ts`
- `tests/geminiService.test.ts` (create)
- `tests/geminiHandler.test.ts` (extend — created by plan 003)
- `SECURITY.md` (document the client behavior)

**Out of scope** (do NOT touch, even though they look related):
- `App.tsx` — the existing "error string as chat bubble" channel is how restricted-access feedback reaches the user; no UI work.
- Rate limiting, request validation, and the system prompt in `api/gemini.ts` (plans 003/004/006 own those regions).
- Building a styled password dialog — `window.prompt` is deliberate scope control; see maintenance notes.

## Git workflow

- Branch: `fix/chat-access-password-client`
- Commit style: conventional, e.g. `fix: let the client supply the optional chat access password`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Constant-time comparison in `api/gemini.ts`

Add `import { timingSafeEqual } from "node:crypto";` and a helper above `handler`:

```ts
const safeEqual = (a: string, b: string): boolean => {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
};
```

In the gate block, replace `providedAccessPassword !== configuredAccessPassword` with `!providedAccessPassword || !safeEqual(providedAccessPassword, configuredAccessPassword)`.

**Verify**: `npm run lint` → exit 0.

### Step 2: Client support in `services/geminiService.ts`

Behavior to implement (keep `getGeminiResponse`'s signature and default-path behavior identical):

1. Module constant `ACCESS_PASSWORD_STORAGE_KEY = "fit-for-cancer-chat-access-password"` (sessionStorage — deliberately not localStorage; cleared when the browser session ends).
2. Extract the fetch into an internal helper that takes an optional password and adds the `"x-chat-access-password"` header only when a non-empty password is provided.
3. In `getGeminiResponse`: read the stored password (guard `typeof window !== "undefined"` like `utils/patientContextStorage.ts:8` does); attach it if present; make the request.
4. If the response status is 401: call `window.prompt("This chat is access-restricted. Enter the access password:")`. If the user provides a non-empty value, store it in sessionStorage and retry the request **once** with the new password. If the retry is also 401, remove the stored password and return the server's error string (existing behavior). If the user cancels the prompt, return the server's error string.
5. Any non-401 path is unchanged.

**Verify**: `npm run lint` → exit 0. `npm run build` → exit 0.

### Step 3: Server tests (extend `tests/geminiHandler.test.ts`)

Set `process.env.CHAT_ACCESS_PASSWORD = "letmein"` inside these tests and delete it in `afterEach` (other handler tests rely on it being unset). Unique `x-forwarded-for` per request (rate limiter). Cases:
1. Gate enabled, no header → 401 `{ error: "Chat access is restricted" }`, upstream fetch NOT called.
2. Gate enabled, wrong header → 401, fetch NOT called.
3. Gate enabled, correct header → 200 (with mocked upstream, pattern from plan 003's tests).
4. Gate disabled (env deleted), no header → 200.

### Step 4: Client tests (`tests/geminiService.test.ts`)

happy-dom provides `window.sessionStorage`; stub global `fetch` with `vi.fn()` and `window.prompt` with `vi.spyOn(window, "prompt")`. Cases:
1. No stored password → fetch called WITHOUT `x-chat-access-password` header.
2. Stored password → fetch called WITH the header.
3. First response 401, prompt returns `"pw"` → second fetch carries the header, its 200 result is returned, and sessionStorage now holds `"pw"`.
4. First response 401, prompt returns `null` (cancel) → exactly one fetch, returns the server error string.
5. 401 then 401 again after prompt → two fetches, stored password removed, error string returned.

**Verify**: `npm test` → all pass.

### Step 5: Update `SECURITY.md`

In the "optional chat access gate" bullet (lines 12–15), add: the client prompts for the password on first 401 and remembers it for the browser session (sessionStorage); comparison is constant-time server-side.

**Verify**: `grep -n "sessionStorage" SECURITY.md` → 1 match.

## Test plan

See Steps 3–4. Server cases model on plan 003's `tests/geminiHandler.test.ts`; client cases establish the pattern for service-layer tests (stubbed `fetch`, happy-dom storage).

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npm run lint` exits 0
- [ ] `npm test` exits 0, including the 4 new handler cases and 5 new service cases
- [ ] `npm run build` exits 0
- [ ] `grep -n "timingSafeEqual" api/gemini.ts` → match
- [ ] `grep -n "x-chat-access-password" services/geminiService.ts` → match
- [ ] `git status` shows changes only to in-scope files
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The gate block in `api/gemini.ts` no longer matches the excerpt after accounting for plans 003/004 (drift).
- Plan 003's `tests/geminiHandler.test.ts` does not exist (dependency not landed) — write only `tests/geminiService.test.ts` plus a NEW minimal handler test file for the 4 gate cases, and say so in the report.
- `node:crypto` import fails the build (would indicate the function is being bundled for an edge runtime — it isn't today).
- You find yourself adding state to `App.tsx` — the design above intentionally avoids it.

## Maintenance notes

- `window.prompt` is the deliberate minimal UI. If the gate ever becomes a real product feature (e.g. clinic pilots), replace it with a styled modal in `App.tsx` — the service-layer storage/retry logic stays the same.
- This gate is a soft kill-switch, not authentication: the password is shared, sent on every request, and visible in the browser's network panel and sessionStorage to anyone at the keyboard. Do not build real auth on top of it.
- Alternative considered and rejected: deleting the gate entirely. It's documented in SECURITY.md as an operational kill-switch and costs little to keep once the client can pass it.
