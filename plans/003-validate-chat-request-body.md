# Plan 003: Validate and bound the /api/gemini request body

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat c3c6355..HEAD -- api/gemini.ts services/geminiService.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW (pure tightening; legitimate client payloads are far below the new caps)
- **Depends on**: plans/001-test-baseline-vitest.md
- **Category**: security
- **Planned at**: commit `c3c6355`, 2026-06-11

## Why this matters

`/api/gemini` is a public, unauthenticated endpoint that forwards the request's `history` array verbatim to the Gemini API, billed to the project's `GEMINI_API_KEY`. The only check today is that `history` is a non-empty array — message count, message length, and `role` values are unbounded and unvalidated. A single client (within the 20-requests/10-minutes rate limit) can ship multi-megabyte histories and run up the Gemini token bill, and bogus roles produce opaque upstream 4xx errors. As a smaller hardening item in the same file, the API key is currently sent as a URL query parameter; Google supports the `x-goog-api-key` header, which keeps the key out of any URL-based logging.

## Current state

- `api/gemini.ts` (330 lines) — Vercel serverless function (legacy `(req, res)` signature, typed locally as `VercelLikeRequest`/`VercelLikeResponse`). Validation today:

  ```ts
  // api/gemini.ts:261-270
  const body = parseBody(req.body);
  if (!body) {
    res.status(400).json({ error: "Invalid JSON payload" });
    return;
  }

  if (!Array.isArray(body.history) || body.history.length === 0) {
    res.status(400).json({ error: "Request history is required" });
    return;
  }
  ```

  The upstream call passes roles and content through untouched, with the key in the URL:

  ```ts
  // api/gemini.ts:279-291
  const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      systemInstruction: { ... },
      contents: body.history.map((message) => ({
        role: message.role,
        parts: [{ text: message.content }],
      })),
      ...
  ```

- The expected message shape (from `types.ts`): `ChatMessage = { role: 'user' | 'model'; content: string }`. `ChatContext` has `fatigueScore: number | null`, `fatigueZone: string | null`, `isMyelomaPatient: boolean`, `cancerType?: CancerTypeOption`. Valid `cancerType` values (see `formatCancerTypeLabel`, api/gemini.ts:54-63): `bowel | melanoma | breast | prostate | lung | blood_myeloma | other`.
- The legitimate client (`services/geminiService.ts:5-17`) sends the full visible chat history; a long session might reach a few dozen messages of a few hundred characters each.
- **Vercel gotcha**: every non-underscore-prefixed file in `api/` is deployed as a serverless function. Do NOT create new helper files in `api/` — put validation helpers inside `api/gemini.ts`.
- Conventions in this file: double quotes, arrow-function helpers defined above `handler`, early-return `res.status(...).json(...)` for errors.

## Commands you will need

| Purpose   | Command        | Expected on success |
|-----------|----------------|---------------------|
| Install   | `npm install`  | exit 0              |
| Typecheck | `npm run lint` | exit 0              |
| Tests     | `npm test`     | all pass            |
| Build     | `npm run build`| exit 0              |

## Scope

**In scope** (the only files you should modify or create):
- `api/gemini.ts`
- `tests/geminiHandler.test.ts` (create)

**Out of scope** (do NOT touch, even though they look related):
- `services/geminiService.ts` — the client already sends conforming payloads; no change needed.
- `api/rateLimit.ts` — rate limiting is plan 004.
- The system-instruction text (`getSystemInstruction`) — plan 006 touches it; avoid merge conflicts.
- The `CHAT_ACCESS_PASSWORD` block (api/gemini.ts:246-253) — plan 005.

## Git workflow

- Branch: `fix/validate-gemini-request-body`
- Commit style: conventional, e.g. `fix: validate and bound /api/gemini request payloads`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add a validator inside `api/gemini.ts`

Above `handler`, add constants and a validator (hand-rolled — do not add zod or any dependency):

```ts
const MAX_HISTORY_MESSAGES = 40;
const MAX_MESSAGE_CHARS = 4000;
const MAX_TOTAL_CHARS = 24000;
const VALID_ROLES = new Set(["user", "model"]);
const VALID_CANCER_TYPES = new Set(["bowel", "melanoma", "breast", "prostate", "lung", "blood_myeloma", "other"]);

const validateRequestBody = (body: GeminiRequestBody): string | null => {
  // returns an error message, or null when valid
};
```

Validation rules (in order; return the first failure):
1. `history` is an array with 1–`MAX_HISTORY_MESSAGES` entries → else `"Request history is required"` (empty/missing) or `"Request history is too long"`.
2. Every entry: `role` is in `VALID_ROLES` and `content` is a string with `1 ≤ length ≤ MAX_MESSAGE_CHARS` → else `"Request history contains an invalid message"`.
3. Sum of all `content.length` ≤ `MAX_TOTAL_CHARS` → else `"Request history is too large"`.
4. If `cancerType` is present (top-level or `context.cancerType`): must be in `VALID_CANCER_TYPES` → else `"Invalid cancer type"`.
5. If `context` is present: must be a plain object; `fatigueScore` must be `null`, `undefined`, or an integer 0–10; `fatigueZone` must be `null`, `undefined`, or a string ≤ 20 chars; `isMyelomaPatient` must be `undefined` or boolean → else `"Invalid context"`.

In `handler`, replace the existing `history` check (api/gemini.ts:267-270) with:

```ts
const validationError = validateRequestBody(body);
if (validationError) {
  res.status(400).json({ error: validationError });
  return;
}
```

Keep the `parseBody` null-check as is. Validation runs AFTER the rate-limit check (an attacker probing the validator still burns their quota).

**Verify**: `npm run lint` → exit 0.

### Step 2: Move the API key to a header

Change the upstream fetch (api/gemini.ts:279-283) to:

```ts
const geminiResponse = await fetch(GEMINI_API_URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-goog-api-key": apiKey,
  },
  ...
```

(`x-goog-api-key` is Google's documented header equivalent of `?key=`.)

**Verify**: `grep -n "key=" api/gemini.ts` → no match on the fetch URL line.

### Step 3: Write `tests/geminiHandler.test.ts`

Import the default export: `import handler from "../api/gemini";` with explicit vitest imports. Test setup per test:

- `process.env.GEMINI_API_KEY = "test-key"` (and ensure `CHAT_ACCESS_PASSWORD`/`FFC_CHAT_ACCESS_PASSWORD` are deleted from `process.env`).
- Stub fetch: `const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);` — restore with `vi.unstubAllGlobals()` in `afterEach`.
- Fake response object capturing status/body:

  ```ts
  const makeRes = () => {
    const out: { status?: number; body?: unknown } = {};
    return {
      out,
      res: { status: (code: number) => ({ json: (body: unknown) => { out.status = code; out.body = body; } }) },
    };
  };
  ```

- **Rate-limit isolation**: the handler calls `checkGeminiRateLimit`, which buckets by client IP with a limit of 20. Give EVERY test request a unique `x-forwarded-for` header (e.g. `10.0.${i}.1`) so tests never trip the limiter.

Cases:
1. `method: "GET"` → 405.
2. Valid minimal body (`{ history: [{ role: "user", content: "hi" }] }`) with fetch mocked to return `{ ok: true, status: 200, text: async () => JSON.stringify({ candidates: [{ content: { parts: [{ text: "hello" }] } }] }) }` → 200, `{ text: "hello" }`, and fetch called once with headers containing `"x-goog-api-key": "test-key"` and a URL NOT containing `key=`.
3. 41 messages → 400 "Request history is too long"; fetch NOT called.
4. One message with `content` of 4001 chars → 400; fetch NOT called.
5. Total content > 24000 chars across messages → 400; fetch NOT called.
6. `role: "system"` → 400; fetch NOT called.
7. `content: 42` (non-string) → 400; fetch NOT called.
8. `cancerType: "everything"` → 400; fetch NOT called.
9. `context: { fatigueScore: 99 }` → 400; fetch NOT called.
10. Valid body with `context: { fatigueScore: 7, fatigueZone: "🔴 Red", isMyelomaPatient: false, cancerType: "lung" }` → 200 (with mocked upstream).

**Verify**: `npm test` → all pass.

## Test plan

See Step 3 — `tests/geminiHandler.test.ts`, modeled on the explicit-import pattern from plan 001's tests. Cases 3–9 are the regression suite for this finding.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npm run lint` exits 0
- [ ] `npm test` exits 0; `tests/geminiHandler.test.ts` covers the 10 cases above
- [ ] `npm run build` exits 0
- [ ] `grep -n "x-goog-api-key" api/gemini.ts` → 1 match; `grep -n '?key=' api/gemini.ts` → 0 matches
- [ ] `git status` shows changes only to: `api/gemini.ts`, `tests/geminiHandler.test.ts`
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The handler code at the excerpted lines doesn't match (drift) — plans 004/005/006 also edit this file; check `plans/README.md` for what already landed and re-locate the excerpts before assuming conflict.
- Plan 001 has not landed (`npm test` missing).
- Importing `../api/gemini` into a vitest test fails because of its module-level imports (`./rateLimit.js`, `../utils/...js` extensions) — report the resolver error; do not rewrite import paths across the repo to work around it.
- You are tempted to add a validation library — don't; report if hand-rolled validation genuinely can't express a rule.

## Maintenance notes

- The caps (40 messages / 4k chars / 24k total) comfortably exceed real sessions but bound worst-case Gemini spend per request. If a "long conversation" feature lands, raise `MAX_HISTORY_MESSAGES` and consider summarizing old turns instead of forwarding them.
- The client (`services/geminiService.ts`) surfaces the server's `error` string directly in chat, so the 400 messages above are patient-facing — keep them calm and non-technical if edited.
- `api/rateLimit.ts` is deployed as its own (non-functional) endpoint because every file in `api/` becomes a function. Underscore-prefixing it (`api/_rateLimit.ts`) would remove that surface — deferred; do it in plan 004 only if touching the file anyway proves trivial, otherwise leave it.
