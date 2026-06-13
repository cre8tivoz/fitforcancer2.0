# Plan 001: Establish a Vitest test baseline for safety-critical pure logic

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat c3c6355..HEAD -- package.json api/rateLimit.ts utils/patientContextStorage.ts tsconfig.json vite.config.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `c3c6355`, 2026-06-11

## Why this matters

This app gives exercise and nutrition guidance to cancer patients, keyed off a fatigue "zone" (Green/Yellow/Red). None of that logic has a single test — the repo has no test runner, no test script, and no test files. The only verification command is `npm run lint` (which is `tsc --noEmit`). Plans 002–005 change safety-relevant behavior (fatigue-score detection, API request validation, rate limiting, auth gating); without a test baseline those changes cannot be verified mechanically. This plan installs Vitest and writes characterization tests for the two pure modules that later plans build on.

## Current state

- `package.json` — scripts are only: `dev`, `build`, `preview`, `lint` (`tsc --noEmit`). No `test` script. Package manager is npm (there is a `package-lock.json`). `engines.node` is `20.x`. Vite is `^6.4.3`.
- `api/rateLimit.ts` (75 lines) — pure in-memory rate limiter used by the Gemini proxy. Exports `getHeaderValue`, `getClientIp`, `checkRateLimit`, `checkGeminiRateLimit`. Module-level shared state:

  ```ts
  // api/rateLimit.ts:6-9
  const buckets = new Map<string, RateLimitBucket>();

  const DEFAULT_WINDOW_MS = 10 * 60 * 1000;
  const DEFAULT_LIMIT = 20;
  ```

  ```ts
  // api/rateLimit.ts:38-45
  export const getClientIp = (headers: Record<string, string | string[] | undefined> | undefined): string => {
    const forwardedFor = getHeaderValue(headers, "x-forwarded-for");
    if (forwardedFor) {
      return forwardedFor.split(",")[0]?.trim() || "unknown";
    }
    return getHeaderValue(headers, "x-real-ip")?.trim() || "unknown";
  };
  ```

- `utils/patientContextStorage.ts` (110 lines) — localStorage persistence for patient context and energy-history check-ins. Key behaviors: 14-day expiry (`FOURTEEN_DAYS_MS`, line 5), corrupt-JSON self-healing (lines 51–54, 90–93), malformed-entry filtering in `getEnergyHistory` (lines 82–89), 30-entry cap in `saveDailyCheckIn` (`MAX_ENERGY_HISTORY_ENTRIES`, line 108). Storage keys: `fit-for-cancer-patient-context` and `energy_history`.
- `tsconfig.json` — has **no `include`/`exclude`**, so `tsc --noEmit` typechecks every `.ts` file in the repo, including new test files. `compilerOptions.types` is `["node"]` — therefore tests MUST import `describe/it/expect/vi` explicitly from `vitest` (do NOT use Vitest globals, and do NOT edit `tsconfig.json`).
- `vite.config.ts` — exists, configures React, Tailwind, and `vite-plugin-pwa`. Do not modify it; use a separate `vitest.config.ts`.
- Repo TypeScript conventions: arrow-function exports (`export const fn = (...) => ...`), double quotes in `api/` and `utils/` files, no semicolon omission.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Install   | `npm install`            | exit 0              |
| Add dev deps | `npm install -D vitest happy-dom` | exit 0 |
| Typecheck | `npm run lint`           | exit 0, no output   |
| Tests     | `npm test`               | all pass            |
| Build     | `npm run build`          | exit 0              |

## Scope

**In scope** (the only files you should modify or create):
- `package.json` (add `test` script + dev deps; npm will update `package-lock.json`)
- `vitest.config.ts` (create)
- `tests/rateLimit.test.ts` (create)
- `tests/patientContextStorage.test.ts` (create)

**Out of scope** (do NOT touch, even though they look related):
- `tsconfig.json` — explicit vitest imports make config changes unnecessary.
- `vite.config.ts` — the PWA build is sensitive; keep test config separate.
- Any file under `api/`, `utils/`, `components/`, or `App.tsx` — this plan adds tests only, zero behavior change.

## Git workflow

- Branch: `chore/test-baseline-vitest` (repo convention from history: `fix/...`, `chore/...` prefixes)
- Commit style: conventional, e.g. `chore: add vitest baseline with rate-limit and storage tests` (matches `chore(deps): safe minor/patch bumps for weekly QA audit` in `git log`)
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Install Vitest and happy-dom

Run `npm install -D vitest happy-dom`. Use whatever latest versions npm resolves (Vitest 3.x is compatible with Vite 6).

**Verify**: `npm ls vitest happy-dom` → both listed, exit 0.

### Step 2: Add the test script and vitest config

In `package.json` scripts, add: `"test": "vitest run"`.

Create `vitest.config.ts` at the repo root:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "happy-dom",
    include: ["tests/**/*.test.ts"],
  },
});
```

**Verify**: `npm test` → exit code 1 with "No test files found" (expected — none written yet). `npm run lint` → exit 0.

### Step 3: Write `tests/rateLimit.test.ts`

Import explicitly: `import { describe, it, expect, vi, afterEach } from "vitest";` and `import { checkRateLimit, getClientIp, getHeaderValue } from "../api/rateLimit";`.

IMPORTANT: the `buckets` Map in `api/rateLimit.ts` is module-level and shared across all tests in the file. Use a **unique key per test** (e.g. `` `test-${expect.getState().currentTestName}` `` or a counter) so tests don't pollute each other. Use `vi.useFakeTimers()` + `vi.setSystemTime(...)` for window-expiry tests and restore real timers in `afterEach`.

Cases to cover:
1. First call for a key → `allowed: true`, `remaining: limit - 1`.
2. Calls up to the limit succeed; call `limit + 1` within the window → `allowed: false`, `remaining: 0`.
3. After advancing fake time past `windowMs`, the same key is allowed again with a fresh window (`resetAt` > previous `resetAt`).
4. `getClientIp` with `x-forwarded-for: "1.2.3.4, 5.6.7.8"` → `"1.2.3.4"`.
5. `getClientIp` with no `x-forwarded-for` but `x-real-ip: "9.9.9.9"` → `"9.9.9.9"`.
6. `getClientIp` with no headers / empty object → `"unknown"`.
7. `getHeaderValue` is case-insensitive (`{ "X-Real-IP": "9.9.9.9" }` found via `"x-real-ip"`) and takes the first element of array values.

**Verify**: `npm test` → this file passes (7+ tests).

### Step 4: Write `tests/patientContextStorage.test.ts`

happy-dom provides `window.localStorage`. Clear it in a `beforeEach` (`window.localStorage.clear()`). Import the functions explicitly from `../utils/patientContextStorage`.

Cases to cover:
1. `savePatientContext({ cancerType: "breast" })` then `loadPatientContext()` → returns `{ cancerType: "breast" }`.
2. Expiry: save a context, advance fake time by more than 14 days (`vi.setSystemTime`), `loadPatientContext()` → `null`, and the `fit-for-cancer-patient-context` key is removed from localStorage.
3. Corrupt record: `window.localStorage.setItem("fit-for-cancer-patient-context", "not-json")` → `loadPatientContext()` returns `null` and the key is removed.
4. Wrong-shape record (e.g. `JSON.stringify({ timestamp: "nope" })`) → `null` and key removed.
5. `getEnergyHistory` with valid entries returns them; with a non-array (`"{}"`) returns `[]` and removes the `energy_history` key; with a mixed array keeps only entries having numeric `id`, string `date`, numeric `score`, string `note`.
6. `saveDailyCheckIn` appends an entry; after 31 saves only the most recent 30 remain (note: `id` is `Date.now()` — advance fake time between saves so ids differ).

**Verify**: `npm test` → all tests in both files pass.

### Step 5: Full gate

**Verify**: `npm run lint` → exit 0. `npm test` → all pass. `npm run build` → exit 0 (proves the new dev deps and config don't break the production build).

## Test plan

This plan IS the test plan — see steps 3–4. There is no existing test to use as a pattern; these two files become the repo's pattern (explicit vitest imports, `tests/` directory, one file per module under test).

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npm run lint` exits 0
- [ ] `npm test` exits 0 with ≥13 passing tests across `tests/rateLimit.test.ts` and `tests/patientContextStorage.test.ts`
- [ ] `npm run build` exits 0
- [ ] `git status` shows changes only to: `package.json`, `package-lock.json`, `vitest.config.ts`, `tests/`
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `npm install -D vitest happy-dom` fails with a peer-dependency conflict against `vite@6` — report the exact error rather than forcing `--legacy-peer-deps`.
- `npm run lint` fails on the new test files for type reasons that explicit `vitest` imports don't solve — do NOT edit `tsconfig.json`; report instead.
- The excerpted code in `api/rateLimit.ts` or `utils/patientContextStorage.ts` does not match what you find (drift).
- A behavior you're characterizing looks like a bug (e.g. expiry doesn't fire). Tests in this plan document CURRENT behavior — report suspected bugs, don't fix them here.

## Maintenance notes

- Plans 002–005 add their own test files under `tests/` following this pattern; keep explicit vitest imports until/unless `tsconfig.json` gains a `types` entry for vitest globals.
- The module-level `buckets` Map in `api/rateLimit.ts` makes rate-limit tests order-sensitive if keys are reused — reviewers should reject tests that share keys.
- CI does not exist; `npm test` should be wired into any future CI/pre-merge workflow.
