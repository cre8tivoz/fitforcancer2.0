# Plan 002: Stop treating every digit in a chat message as a fatigue score

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat c3c6355..HEAD -- App.tsx utils/`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED (changes when the app auto-updates a patient's fatigue zone — over-detection and under-detection both have clinical UX cost)
- **Depends on**: plans/001-test-baseline-vitest.md
- **Category**: bug
- **Planned at**: commit `c3c6355`, 2026-06-11

## Why this matters

The chat handler scans every outgoing user message with `/\b([0-9]|10)\b/` and treats the **first bare digit found** as the patient's fatigue score. A message like "I did 3 short walks today" silently sets the score to 3, flips the patient into the 🟢 Green zone, switches the Exercise and Nutrition panels to standard-intensity recommendations, and can log an incorrect daily check-in. For a severely fatigued patient this surfaces strength-training advice that the app's own Red-zone safety rules exist to prevent. The fix narrows detection to messages that plausibly *report* a fatigue score, and moves the logic into a pure, tested module.

## Current state

- `App.tsx` (1516 lines) — the entire UI. The bug is in `handleSendMessage`:

  ```tsx
  // App.tsx:473-479
  const scoreMatch = textToSend.match(/\b([0-9]|10)\b/);
  if (scoreMatch) {
    const score = parseInt(scoreMatch[1]);
    updatedScore = score;
    handleFatigueScoreSelect(score);
    updatedZone = score >= 7 ? '\u{1F534} Red' : score >= 4 ? '\u{1F7E1} Yellow' : '\u{1F7E2} Green';
  }
  ```

  The score→zone mapping is duplicated a few lines above (the `\u{1F7E2}` escapes are the 🟢🟡🔴 emoji):

  ```tsx
  // App.tsx:420-429
  const handleFatigueScoreSelect = (score: number) => {
    setFatigueScore(score);

    const zone: '\u{1F7E2} Green' | '\u{1F7E1} Yellow' | '\u{1F534} Red' =
      score >= 7 ? '\u{1F534} Red' : score >= 4 ? '\u{1F7E1} Yellow' : '\u{1F7E2} Green';

    setFatigueZone(zone);
    setExerciseZoneFilter(null);
    setRecipeZoneFilter(null);
  };
  ```

- Context: the assistant's first message asks "on a scale of 0–10, how is your fatigue today?", so the legitimate inputs to detect are replies like `"7"`, `"7/10"`, `"my fatigue is 7"`. There is also a button grid (App.tsx:1151–1168) that calls `handleFatigueScoreSelect(score)` directly — that path is correct and unaffected.
- `utils/` convention: pure modules with arrow-function named exports, double quotes (see `utils/patientContextStorage.ts`). Tests live in `tests/` with explicit `vitest` imports (established by plan 001).
- The zone string type `'🟢 Green' | '🟡 Yellow' | '🔴 Red'` is currently written inline in several `useState` calls (App.tsx:177–180); `types.ts` does not define it.

## Commands you will need

| Purpose   | Command        | Expected on success |
|-----------|----------------|---------------------|
| Install   | `npm install`  | exit 0              |
| Typecheck | `npm run lint` | exit 0              |
| Tests     | `npm test`     | all pass            |
| Build     | `npm run build`| exit 0              |

## Scope

**In scope** (the only files you should modify or create):
- `utils/fatigueScore.ts` (create)
- `tests/fatigueScore.test.ts` (create)
- `App.tsx` — only the two excerpted regions (the `scoreMatch` block and `handleFatigueScoreSelect`)

**Out of scope** (do NOT touch, even though they look related):
- `api/gemini.ts` — the system prompt's score-handling instructions are server-side model guidance, not this bug.
- The fatigue button grid (App.tsx:1151–1168) and the storage `useEffect`s (App.tsx:226–252) — they already behave correctly.
- The duplicated red-zone proactive message (App.tsx:498–506) — that is plan 006.
- `types.ts` — keep the new zone type in `utils/fatigueScore.ts` to avoid a repo-wide type migration.

## Git workflow

- Branch: `fix/fatigue-score-detection`
- Commit style: conventional, e.g. `fix: only detect fatigue scores from explicit score statements`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Create `utils/fatigueScore.ts`

```ts
export type FatigueZone = "🟢 Green" | "🟡 Yellow" | "🔴 Red";

export const getFatigueZone = (score: number): FatigueZone =>
  score >= 7 ? "🔴 Red" : score >= 4 ? "🟡 Yellow" : "🟢 Green";

/**
 * Detects an explicitly reported fatigue score (0-10) in a chat message.
 * Returns null unless the message plausibly REPORTS a score:
 *   - the whole message is just a number ("7", "7/10", " 7. ")
 *   - an "N/10" or "N out of 10" phrase appears anywhere
 *   - a number directly follows a fatigue keyword (fatigue/energy/tired/
 *     tiredness/score), allowing only filler words like "is/was/at/about/
 *     around/a/an/level/:/=" between keyword and number
 */
export const detectFatigueScore = (text: string): number | null => { ... };
```

Implement `detectFatigueScore` with three ordered checks (first match wins); parse with `parseInt` and return only if the value is an integer 0–10:

1. **Bare reply**: `/^\s*(10|[0-9])\s*(?:\/\s*10)?\s*\.?\s*$/`
2. **N out of 10**: `/\b(10|[0-9])\s*(?:\/|out of)\s*10\b/i`
3. **Keyword-anchored**: keyword then optional filler then number, e.g.
   `/(?:fatigue|energy|tired(?:ness)?|score)(?:\s*(?:level|score|is|was|at|of|about|around|a|an|:|=|-|–))*\s*(10|[0-9])\b/i`

The behavioral contract is the test list in Step 3 — the exact regexes may be adjusted to satisfy it, but every listed case must pass.

**Verify**: `npm run lint` → exit 0.

### Step 2: Write `tests/fatigueScore.test.ts`

Explicit vitest imports (no globals — `tsconfig.json` types is `["node"]`). Cover at minimum:

`detectFatigueScore` — MUST detect (expected value in parens):
- `"7"` (7), `" 10 "` (10), `"7/10"` (7), `"3."` (3)
- `"8 out of 10"` (8), `"I'd say 4/10 today"` (4)
- `"my fatigue is 7"` (7), `"fatigue 7"` (7), `"My fatigue score is 9"` (9)
- `"energy is about a 4"` (4), `"feeling tired, maybe a 8"` — if this one is hard to support without false positives, it MAY return null; do not contort the regex for it.

`detectFatigueScore` — MUST return null:
- `"I did 3 short walks today"`
- `"I walked for 30 minutes"`
- `"Can I do 2 sessions per day?"`
- `"I slept 9 hours last night"`
- `"I'm tired after 2 meetings"` (keyword present but "after" is not a filler word)
- `"What does the 0-10 scale mean?"` — STOP-check: with regex 3 above, "scale" is not a keyword and "0-10" has no keyword prefix, but verify the bare-reply regex doesn't match; add the case either way.
- `""`, `"hello"`, `"11/10"` (out of range → null), `"15"`

`getFatigueZone`:
- 0 and 3 → `"🟢 Green"`; 4 and 6 → `"🟡 Yellow"`; 7 and 10 → `"🔴 Red"`.

**Verify**: `npm test` → all pass.

### Step 3: Rewire `App.tsx`

1. Add import: `import { detectFatigueScore, getFatigueZone } from './utils/fatigueScore';` (App.tsx imports use single quotes and no extension — match that).
2. Replace the body of the zone computation in `handleFatigueScoreSelect` (App.tsx:423-424) with `const zone = getFatigueZone(score);`.
3. Replace the `scoreMatch` block (App.tsx:473-479) with:

   ```tsx
   const detectedScore = detectFatigueScore(textToSend);
   if (detectedScore !== null) {
     updatedScore = detectedScore;
     handleFatigueScoreSelect(detectedScore);
     updatedZone = getFatigueZone(detectedScore);
   }
   ```

Do not change anything else in `handleSendMessage` — in particular the `isInitialCheckIn` logic (App.tsx:432, 481–486) and the offline branch must remain byte-identical.

**Verify**: `npm run lint` → exit 0. `npm test` → all pass. `npm run build` → exit 0.

### Step 4: Manual smoke check (if a browser is available; otherwise note it was skipped)

`npm run dev`, open http://localhost:3000/assistant, type "I did 3 short walks today" with no score set → the fatigue prompt must still show "Check Your Battery" (no zone set). Then type "7" → zone banner shows 🔴 Red 7/10.

**Verify**: behavior as described, or record "smoke check skipped — no browser" in the completion report.

## Test plan

See Step 2 — `tests/fatigueScore.test.ts`, modeled structurally on `tests/rateLimit.test.ts` from plan 001 (explicit imports, `describe` per function). The false-positive cases ("3 short walks", "30 minutes", "slept 9 hours") are the regression tests for this exact bug.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npm run lint` exits 0
- [ ] `npm test` exits 0; `tests/fatigueScore.test.ts` exists with the cases above passing
- [ ] `npm run build` exits 0
- [ ] `grep -n "scoreMatch" App.tsx` returns no matches
- [ ] `grep -c "score >= 7" App.tsx` returns 0 (zone mapping now lives only in `utils/fatigueScore.ts`; the button-grid styling thresholds at App.tsx:1160-1161 use `score >= 7 ?` in className ternaries — those are styling, NOT zone logic, and must remain; if this grep conflicts with them, scope the check to `handleSendMessage`/`handleFatigueScoreSelect` and note it)
- [ ] `git status` shows changes only to: `App.tsx`, `utils/fatigueScore.ts`, `tests/fatigueScore.test.ts`
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The `scoreMatch` block or `handleFatigueScoreSelect` no longer match the excerpts (drift).
- Plan 001 has not landed (`npm test` is not a valid script) — this plan depends on it.
- Satisfying the MUST-detect list forces a regex that also matches any MUST-null case — report the conflict with the failing cases instead of weakening either list.
- You find other call sites that parse scores from free text beyond App.tsx:473.

## Maintenance notes

- Detection is intentionally conservative: a patient writing an unusual phrasing ("I'm sitting at seven today" — word numbers) will NOT be auto-detected and must use the button grid. If product wants word-number support, extend `detectFatigueScore` + tests; do not loosen the digit regexes.
- The system prompt in `api/gemini.ts` (Task 1) tells the model to detect scores conversationally — the model may acknowledge a score the client didn't detect. That's acceptable (model acknowledgment ≠ panel update) but reviewers should know the two detectors are independent.
- If a dedicated zone type is later added to `types.ts`, migrate `FatigueZone` there and update the `useState` literals at App.tsx:177–180.
