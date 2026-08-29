# ATHENA Recommendation Correctness

## Objective

Resolve the recommendation-quality failures exposed by the 29 August 2026 human test without splitting closely related state/orchestration fixes across multiple PRs.

This work should land as one focused recommendation-correctness PR unless implementation reveals an unrelated architectural change.

The existing boundary remains authoritative:

```text
User state + request
  ↓
Gemini interprets intent
  ↓
Fit For Cancer applies fatigue state + deterministic catalogue rules
  ↓
Gemini synthesises canonical results
  ↓
Fit For Cancer renders canonical cards
```

Gemini must not own fatigue-zone mapping, previous-item IDs, canonical selection, or card content.

## 1. Restore one fatigue-score contract

### Problem

ATHENA's newer UI calls the 0–10 check-in an "energy" score while the app's canonical zone mapping still treats it as fatigue severity:

- 0–3 = Green
- 4–6 = Yellow
- 7–10 = Red

The Home page and original fatigue design define the intended scale as:

- 0 = no fatigue
- 10 = worst fatigue

Calling the same value "energy" makes a user-entered 1/10 naturally mean "almost no energy" while the app correctly interprets 1 as low fatigue/high capacity.

### Change

Keep the existing zone mapping and make ATHENA's user-facing check-in language consistently describe **fatigue**, not energy.

Required user-facing rules:

- ask "How is your fatigue today?";
- explain 0 = no fatigue and 10 = worst fatigue;
- label the active value as Fatigue;
- energy/battery language may remain as informal supporting metaphor, but never as the definition of the numeric scale;
- Energy Bank remains the product feature name.

Also remove "energy" as a recognised keyword from the legacy fatigue-score text detector so future reuse cannot silently interpret an energy rating as fatigue severity.

## 2. Make "another" deterministic

### Problem

A follow-up such as:

> Can you give me another recipe?

can return the same deterministic first catalogue item again.

Prompt-only wording is insufficient because the application owns the actual recommendation order.

### Change

Add an optional boolean recommendation-tool intent flag:

```text
avoid_previous?: boolean
```

Gemini sets it when the user asks for another, a different option, something else, or explicitly points out a repeat.

Fit For Cancer — not Gemini — derives previously returned Movement/Nutrition IDs from structured recommendation refs already present in the current conversation history.

When `avoid_previous` is true:

- exclude prior IDs from the same recommendation domain before deterministic selection;
- preserve the authoritative current fatigue band;
- preserve explicit count and preference handling;
- never accept model-provided exclusion IDs;
- if no unseen same-band item remains, return a bounded no-new-results response rather than repeating an old card.

The normal default recommendation path remains unchanged when `avoid_previous` is omitted or false.

## 3. Harden the single streaming recovery

### Problem

The real compound request can still intermittently exhaust both the streamed selection pass and the single unary recovery with no usable tool/text result.

### Change

Keep the existing one-recovery architecture.

Only on the unary recovery call:

- disable Gemini 2.5 Flash thinking with `thinkingBudget: 0`;
- do not change the model;
- do not change normal first-pass or synthesis thinking behaviour;
- do not add another retry or autonomous loop.

If recovery still exhausts, write privacy-safe structured diagnostics containing only response shape metadata such as finish reason, candidate/part counts and part kinds. Do not log prompts, response text, function args, health context or conversation history.

## 4. Regression coverage

### Fatigue semantics

- 0 and 3 remain Green.
- 4 and 6 remain Yellow.
- 7 and 10 remain Red.
- ATHENA initial/check-in/update copy identifies the value as fatigue.
- user-facing copy explains the endpoints.
- free-text detector no longer treats "energy is 1" as a fatigue score.

### Novelty

- prior Green recipe id 3 + "another recipe" with `avoid_previous: true` returns a different Green recipe.
- prior Movement recommendation is excluded only from Movement, not Nutrition.
- normal recommendations without `avoid_previous` retain existing deterministic ordering.
- if all eligible same-band items are excluded, no old item is repeated.

### Streaming recovery

- unary recovery payload contains `thinkingConfig.thinkingBudget = 0`.
- normal first-pass and final synthesis payloads are otherwise unchanged.
- exhausted recovery emits the existing safe error and privacy-safe shape diagnostics.
- existing compound/whitespace/truncated-stream regressions continue to pass.

## Non-goals

- no Gemini model replacement;
- no catalogue redesign;
- no fatigue-band threshold change;
- no new clinical guidance;
- no recommendation randomisation;
- no durable conversation database;
- no autonomous tool loop;
- no model-selected canonical IDs;
- no broad ATHENA tone rewrite.

## Acceptance criteria

This work is complete when:

- the same 0–10 number is never presented to the user as both energy and fatigue;
- low fatigue still maps to Green and high fatigue still maps to Red;
- asking for another recommendation does not repeat a previously rendered same-domain card when an unseen same-band item exists;
- the streaming recovery remains single-shot but is less vulnerable to thinking-only empty output;
- any remaining exhausted recovery produces privacy-safe diagnostic evidence for the next production test;
- existing quantity, compound, safety, fatigue-band and canonical-card behaviour remains intact.

## Verification

Run:

```bash
pnpm test
pnpm lint
pnpm build
```

A Vercel preview build is useful but does not replace the Vitest suite.
