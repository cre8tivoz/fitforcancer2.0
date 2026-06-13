# Plan 006: Stop delivering the Red-zone panel-update notice twice

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat c3c6355..HEAD -- api/gemini.ts App.tsx`
> `api/gemini.ts` is also edited by plans 003/004/005, and `App.tsx` by
> plan 002 — check `plans/README.md` for what landed and re-locate the
> excerpts below before assuming conflict.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW (removes one instruction sentence from the system prompt; the client-side deterministic message keeps the safety notice guaranteed)
- **Depends on**: none (but execute after 002–005 to avoid same-file merge conflicts)
- **Category**: bug / UX
- **Planned at**: commit `c3c6355`, 2026-06-11

## Why this matters

When a patient's fatigue zone changes to 🔴 Red, the chat shows the "I've updated your Exercise Panel to the Red Zone… pausing strength training" notice **twice**: once because the system prompt orders the model to say it, and once because the client appends a hardcoded copy right after the model's reply. Duplicate safety messaging reads as a glitch and dilutes the notice it's meant to emphasize. The client-side message is deterministic and knows whether the zone actually *changed* (the model doesn't — it only sees current context), so the fix is to keep the client message and remove the model instruction.

## Current state

- `App.tsx` — the client-side (KEEP this; do not modify):

  ```tsx
  // App.tsx:497-506
  // Proactive notification if zone changed to Red
  if (updatedZone === '🔴 Red' && fatigueZone !== '🔴 Red') {
    const proactiveMsg: ChatMessage = {
      role: 'model',
      content: `I've updated your Exercise Panel to the 🔴 Red Zone (Score ${updatedScore}/10). We are pausing strength training today to focus on recovery and gentle stretching.`
    };
    setMessages(prev => [...prev, { role: 'model', content: aiResponse }, proactiveMsg]);
    setIsLoading(false);
    return;
  }
  ```

- `api/gemini.ts`, inside `getSystemInstruction`, Task 6 — the duplicate (REMOVE the second bullet only):

  ```ts
  // api/gemini.ts:161-165
  Task 6: Interaction Design
  - After the user provides their fatigue score, you MUST say: "Based on your fatigue level (Score: ${context?.fatigueScore ?? "X"}/10), I've updated your Nutrition and Exercise Panels. Here are the best recipes for your energy budget today:".
  - If the score changed to Red (7-10), you must also state: "I've updated your Exercise Panel to the Red Zone (Score ${context?.fatigueScore ?? "X"}/10). We are pausing strength training today to focus on recovery and gentle stretching."
  - List 2-3 specific recipes from your library that match their zone.
  - Display the recipes in a clean Markdown table or formatted list with the appropriate zone marker.
  ```

  Note this is a template literal inside a larger string — the "line" to delete is the single `- If the score changed to Red (7-10), ...` bullet (one source line at api/gemini.ts:163).

## Commands you will need

| Purpose   | Command        | Expected on success |
|-----------|----------------|---------------------|
| Typecheck | `npm run lint` | exit 0              |
| Tests     | `npm test`     | all pass (if plan 001 landed; otherwise skip) |
| Build     | `npm run build`| exit 0              |

## Scope

**In scope** (the only file you should modify):
- `api/gemini.ts` — delete exactly one bullet line from the Task 6 block.

**Out of scope** (do NOT touch, even though they look related):
- `App.tsx` — the client-side proactive message stays (it is the deterministic, change-aware copy).
- Task 2's Red Zone phrasing ("Because you're in the Red Zone…", api/gemini.ts:131) — different sentence, different purpose (explaining the zone vs. announcing the panel change); keep it.
- The rest of Task 6 (the "Based on your fatigue level…" sentence and the recipe instructions).

## Git workflow

- Branch: `fix/dedupe-red-zone-notice`
- Commit style: conventional, e.g. `fix: remove duplicated Red-zone panel notice from system prompt`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Delete the duplicate instruction

In `api/gemini.ts`, in the Task 6 block of `getSystemInstruction`, delete the single line:

```
- If the score changed to Red (7-10), you must also state: "I've updated your Exercise Panel to the Red Zone (Score ${context?.fatigueScore ?? "X"}/10). We are pausing strength training today to focus on recovery and gentle stretching."
```

Leave every other line of Task 6 untouched.

**Verify**: `grep -c "pausing strength training" api/gemini.ts` → `0`, and `grep -c "pausing strength training" App.tsx` → `1`.

### Step 2: Full gate

**Verify**: `npm run lint` → exit 0. `npm run build` → exit 0. If `npm test` exists (plan 001), it passes — note that plan 003's handler tests assert on request structure, not prompt text, so no test updates are expected; if one fails on prompt text, treat as a STOP condition rather than editing the assertion silently.

## Test plan

No new tests: the change is a one-line deletion inside a prompt string, and the surviving client-side behavior is plain React state logic that plan 002's scope covers. The greps in Step 1 are the regression check.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `grep -c "pausing strength training" api/gemini.ts` returns 0
- [ ] `grep -c "pausing strength training" App.tsx` returns 1
- [ ] `npm run lint` exits 0; `npm run build` exits 0; `npm test` exits 0 (when the script exists)
- [ ] `git status` shows changes only to `api/gemini.ts`
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The Task 6 block or the App.tsx excerpt no longer matches (drift — especially if a prior plan reworded either copy of the message).
- You find a third copy of the notice elsewhere (`grep -rn "pausing strength training" --include="*.ts*" .` returns more than the two known sites).
- A test asserts on the deleted sentence.

## Maintenance notes

- If the client-side proactive message in `App.tsx` is ever removed or reworded, reconsider whether the model should announce panel updates again — the invariant to preserve is "exactly one Red-zone panel notice, and it fires only when the zone actually changes."
- The model may still organically mention pausing strenuous exercise in Red-zone advice (Task 2 encourages restorative framing); that's content, not the panel-update notice, and is fine.
