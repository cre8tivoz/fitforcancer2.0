# Plan 004: Make /api/gemini rate limiting durable across serverless instances

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat c3c6355..HEAD -- api/rateLimit.ts api/gemini.ts SECURITY.md`
> If `api/gemini.ts` changed: plans 003/005/006 also edit it — check
> `plans/README.md` for what landed and re-locate the excerpts. If
> `api/rateLimit.ts` changed beyond what plan 001's tests characterize,
> treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED (touches the only guard on Gemini API spend; a bug here either blocks patients or unguards the key)
- **Depends on**: plans/001-test-baseline-vitest.md, plans/003-validate-chat-request-body.md (same-file ordering)
- **Category**: security
- **Planned at**: commit `c3c6355`, 2026-06-11

## Why this matters

The 20-requests/10-minutes limit on `/api/gemini` lives in a module-level `Map`, which is per serverless instance: it resets on every cold start and is not shared across concurrently scaled instances. `SECURITY.md:23` already documents this as a known best-effort trade-off and names the upgrade path ("replace it with shared storage such as Upstash, Vercel KV, Redis"). This plan implements that documented upgrade with Upstash Redis (via the Vercel Marketplace), keeping the in-memory limiter as an automatic fallback so local dev and un-provisioned deployments keep working unchanged.

## Current state

- `api/rateLimit.ts` (75 lines) — in-memory limiter. Relevant exports:

  ```ts
  // api/rateLimit.ts:70-75
  export const checkGeminiRateLimit = (
    headers: Record<string, string | string[] | undefined> | undefined,
  ): RateLimitResult => {
    const ip = getClientIp(headers);
    return checkRateLimit(`gemini:${ip}`);
  };
  ```

  `RateLimitResult` is `{ allowed: boolean; remaining: number; resetAt: number }` (lines 21–25). Defaults: `DEFAULT_WINDOW_MS = 10 * 60 * 1000`, `DEFAULT_LIMIT = 20` (lines 8–9).

- `api/gemini.ts` — the single call site (synchronous today):

  ```ts
  // api/gemini.ts:255-259
  const rateLimit = checkGeminiRateLimit(req.headers);
  if (!rateLimit.allowed) {
    res.status(429).json({ error: "Too many requests. Please wait a moment before trying again." });
    return;
  }
  ```

- `tests/rateLimit.test.ts` exists (plan 001) characterizing the in-memory behavior — those tests must keep passing.
- Vercel context: functions run on Fluid Compute (instances are reused and handle concurrent requests, which is why the in-memory map *appears* to work in light traffic). Vercel KV no longer exists as a product; Redis comes via the Vercel Marketplace (Upstash), which injects `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` (named per the integration — see STOP conditions).
- Conventions: double quotes, arrow-function exports, no default exports in `api/rateLimit.ts`.

## Commands you will need

| Purpose   | Command        | Expected on success |
|-----------|----------------|---------------------|
| Install   | `npm install -D` / `npm install @upstash/ratelimit @upstash/redis` | exit 0 |
| Typecheck | `npm run lint` | exit 0              |
| Tests     | `npm test`     | all pass            |
| Build     | `npm run build`| exit 0              |

## Suggested executor toolkit

- Before writing the Upstash code, read the current `@upstash/ratelimit` README (https://github.com/upstash/ratelimit-js) — the constructor/method shapes below are indicative, not gospel; match the installed version's API.
- Env var names verified against Vercel storage docs at planning time: the Upstash Marketplace integration injects `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`, and `Redis.fromEnv()` reads exactly those. The `Ratelimit` shapes in Step 2 (`slidingWindow`, `.limit()` → `{ success, remaining, reset }`) match the documented API.

## Scope

**In scope** (the only files you should modify or create):
- `api/rateLimit.ts`
- `api/gemini.ts` (only the rate-limit call site)
- `tests/rateLimit.test.ts` (extend)
- `package.json` / `package-lock.json` (new deps)
- `SECURITY.md` (update the "Production notes" paragraph)

**Out of scope** (do NOT touch, even though they look related):
- Request-body validation and the upstream fetch in `api/gemini.ts` (plan 003 owns those regions).
- Any persistent storage beyond rate limiting — no analytics, no logging of IPs to Redis beyond the limiter's own keys.
- Renaming `api/rateLimit.ts` to `api/_rateLimit.ts`: do this ONLY if everything else in this plan is green and the rename requires touching nothing but the import in `api/gemini.ts` and the test file; otherwise leave it and note it.

## Git workflow

- Branch: `fix/durable-rate-limiting`
- Commit style: conventional, e.g. `fix: use Upstash Redis for durable Gemini rate limiting with in-memory fallback`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Install dependencies

`npm install @upstash/ratelimit @upstash/redis` (runtime deps, not dev).

**Verify**: `npm ls @upstash/ratelimit @upstash/redis` → both listed, exit 0.

### Step 2: Add the durable limiter with fallback in `api/rateLimit.ts`

Keep ALL existing exports byte-compatible (plan 001's tests must still pass). Add:

```ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let durableLimiter: Ratelimit | null | undefined;

const getDurableLimiter = (): Ratelimit | null => {
  if (durableLimiter !== undefined) return durableLimiter;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  durableLimiter = url && token
    ? new Ratelimit({
        redis: Redis.fromEnv(), // reads UPSTASH_REDIS_REST_URL & UPSTASH_REDIS_REST_TOKEN
        limiter: Ratelimit.slidingWindow(DEFAULT_LIMIT, "10 m"),
        prefix: "ffc:gemini",
      })
    : null;
  return durableLimiter;
};
```

Change `checkGeminiRateLimit` to async:

```ts
export const checkGeminiRateLimit = async (
  headers: Record<string, string | string[] | undefined> | undefined,
): Promise<RateLimitResult> => {
  const ip = getClientIp(headers);
  const limiter = getDurableLimiter();

  if (limiter) {
    try {
      const result = await limiter.limit(`gemini:${ip}`);
      return { allowed: result.success, remaining: result.remaining, resetAt: result.reset };
    } catch (error) {
      console.error("[rateLimit] durable limiter failed, falling back to in-memory");
      // fall through to in-memory
    }
  }

  return checkRateLimit(`gemini:${ip}`);
};
```

Failure posture (deliberate): if Redis errors, fall back to in-memory rather than failing open with no limit or failing closed against patients. Match the installed `@upstash/ratelimit` API if its result field names differ from `success/remaining/reset`.

**Verify**: `npm run lint` → exit 0.

### Step 3: Await the call in `api/gemini.ts`

```ts
const rateLimit = await checkGeminiRateLimit(req.headers);
```

(The handler is already `async`; only add the `await`.)

**Verify**: `npm run lint` → exit 0. `npm run build` → exit 0.

### Step 4: Extend `tests/rateLimit.test.ts`

With `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` absent from `process.env` (delete them in `beforeEach`), `checkGeminiRateLimit`:
1. resolves with `allowed: true` for a fresh IP (unique `x-forwarded-for` per test — buckets are module-shared);
2. resolves `allowed: false` on the 21st call for the same IP (loop 20 times first);
3. existing in-memory tests still pass unmodified.

Do NOT write tests that hit real Redis. A mocked-Redis test of the durable path is optional; if the `@upstash/ratelimit` constructor makes it awkward, skip it and say so in the completion report.

**Verify**: `npm test` → all pass.

### Step 5: Update `SECURITY.md`

Replace the "Production notes" paragraph (lines 21–23) with a short description: durable sliding-window limiting via Upstash Redis when `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` are set (Vercel Marketplace → Upstash integration), automatic in-memory fallback otherwise.

**Verify**: `grep -n "Upstash" SECURITY.md` → matches the new text.

## Test plan

See Step 4. Pattern: `tests/rateLimit.test.ts` from plan 001 (explicit vitest imports, unique keys per test, fake timers where needed).

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npm run lint` exits 0
- [ ] `npm test` exits 0, including the new async-fallback tests and all pre-existing rate-limit tests
- [ ] `npm run build` exits 0
- [ ] `grep -n "await checkGeminiRateLimit" api/gemini.ts` → 1 match
- [ ] `git status` shows changes only to in-scope files
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The installed `@upstash/ratelimit` API differs materially from the Step 2 sketch (e.g. no `slidingWindow`, different result shape) and the README doesn't resolve it in one reading.
- The Upstash Marketplace integration injects env vars under different names (e.g. `KV_REST_API_URL`) — report the actual names; do not guess-support multiple.
- Plan 003 has not landed and `api/gemini.ts` around line 255 doesn't match the excerpt.
- Making `checkGeminiRateLimit` async breaks a caller other than `api/gemini.ts` (`grep -rn "checkGeminiRateLimit" --include="*.ts" .` should show only `api/rateLimit.ts`, `api/gemini.ts`, and tests).

## Maintenance notes

- The operator must provision Upstash Redis via the Vercel Marketplace (`vercel integration add upstash`, or the dashboard) and confirm the env vars exist in production — code degrades silently to in-memory without them. Add a deploy-checklist item.
- Each request now costs one Redis round-trip when durable limiting is active; if latency matters later, `Ratelimit` supports an ephemeral cache option worth enabling.
- If more endpoints are added under `api/`, reuse `getDurableLimiter` with a different prefix rather than a second Redis client.
