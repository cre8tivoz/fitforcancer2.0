# Make ATHENA Think

## Objective

Improve ATHENA’s recommendation handling so that it correctly respects explicit quantities and can return Movement and Nutrition recommendations together in a single turn.

This is an orchestration-hardening change, not a redesign.

The existing architecture remains authoritative:

```text
User request
  ↓
Gemini interprets intent
  ↓
Fit For Cancer executes deterministic recommendation logic
  ↓
Gemini synthesises the returned canonical results
  ↓
Fit For Cancer renders canonical recommendation cards
```

The application — not Gemini — continues to own recommendation selection, fatigue-band eligibility, canonical item IDs, safety metadata and rendering.

Model evaluation or replacement is explicitly out of scope.

---

## Current behaviour to preserve

ATHENA currently exposes two first-party recommendation tools:

- `recommend_movement`
- `recommend_recipe`

The current implementation:

- uses the authoritative current fatigue band;
- selects only canonical app-owned recommendations;
- returns up to three same-zone recommendations;
- applies the existing preference and fallback rules;
- returns no recommendations if no fatigue band is available;
- sends structured recommendation refs for canonical card rendering;
- performs one bounded tool round followed by synthesis with function calling disabled.

The existing default of up to three recommendations remains unchanged when the user does not specify a quantity.

---

## 1. Quantity-aware recommendations

### Problem

Requests such as:

> “Show me one recipe.”

can be understood correctly in ATHENA’s prose while the recommendation layer still returns the default three cards.

### Change

Add an optional `count` argument to both recommendation tools:

```text
recommend_movement(count?: number)
recommend_recipe(count?: number)
```

Rules:

- valid range: 1–3;
- omitted count keeps the current maximum of 3;
- count 1 returns at most 1 eligible canonical recommendation;
- count 2 returns at most 2;
- count 3 returns at most 3;
- application code validates and clamps model-provided values;
- quantity never overrides fatigue-band, preference, eligibility or safety rules;
- requesting more items than are eligible returns only the eligible items.

The quantity controls only how many eligible canonical items are returned. It does not change ranking or recommendation safety.

---

## 2. Compound Movement + Nutrition requests

### Problem

ATHENA currently handles Movement and Nutrition independently but can fail when both are requested in one turn, for example:

> “Give me one exercise and one recipe together.”

> “Show me one card from each.”

### Change

Allow one user turn to contain up to:

- one `recommend_movement` operation; and
- one `recommend_recipe` operation.

The maximum remains deliberately bounded at two recommendation operations per user turn.

Do not introduce an autonomous or recursive agent loop.

Example:

```text
User: Give me one exercise and one recipe.

recommend_movement(count: 1)
recommend_recipe(count: 1)
```

Both calls use the same authoritative user state. Fit For Cancer executes both independently, then Gemini receives the canonical results for the existing synthesis pass.

---

## 3. Preserve domain separation

Do not create a combined recommendation engine or a third `recommend_combined` tool.

Movement and Nutrition remain independent domains.

Compound requests are an orchestration concern only.

---

## 4. Mixed recommendation rendering

The existing structured recommendation-reference contract must support Movement and Nutrition refs in the same response:

```ts
{ kind: "movement", id: "..." }
{ kind: "recipe", id: "..." }
```

Existing rules remain:

- only valid canonical IDs render;
- invalid/stale refs are omitted;
- Gemini cannot provide canonical card presentation data;
- canonical metadata and safety notes are resolved from app-owned data.

No card redesign is required.

---

## 5. Partial failure handling

Compound requests must not become all-or-nothing.

If one recommendation domain succeeds and the other fails:

- preserve and render the successful canonical result;
- provide a short conversational explanation for the failed side;
- do not convert the entire turn into the generic ATHENA connection error.

Only when all requested recommendation operations fail should the existing general error path apply.

---

## 6. Conversational references

ATHENA should support ordinary follow-up language where conversation context makes the requested domains clear, including:

- “Give me one of each.”
- “Show me a card from both.”
- “One exercise and something to eat.”
- “I’m hungry but I also want to move.”

Gemini may resolve natural language into the existing bounded tool calls.

Do not create a large bespoke keyword/intent parser.

---

## 7. Tool-call validation

Application code must validate model-produced tool arguments.

For each recommendation operation:

- recognised tool/domain;
- integer quantity;
- quantity clamped to 1–3;
- maximum one operation per domain per user turn.

Duplicate calls for the same recommendation domain must not produce duplicate recommendation sets.

---

## 8. Regression suite

Add automated regressions for the real failure modes.

### Cardinality

| Input | Expected |
|---|---|
| “Show me some exercises.” | Movement only, existing default max 3 |
| “Show me one exercise.” | Exactly 1 Movement card |
| “Give me two exercises.” | Max 2 Movement cards |
| “Show me one recipe.” | Exactly 1 Nutrition card |
| “Give me two things I could eat.” | Max 2 Nutrition cards |

### Compound intent

| Input | Expected |
|---|---|
| “Give me one exercise and one recipe.” | 1 Movement + 1 Nutrition |
| “Show me one card from each.” | 1 Movement + 1 Nutrition when context establishes both |
| “Give me two exercises and one recipe.” | Max 2 Movement + exactly 1 Nutrition |
| “I’m hungry but I also want something gentle I can do.” | Both domains recognised |

### Failure isolation

Test:

- Movement failure + Nutrition success;
- Nutrition failure + Movement success.

The successful domain must still render.

### Safety/state

Confirm that:

- both domains use the same authoritative current fatigue state;
- compound requests do not bypass same-band selection;
- only canonical eligible recommendations are returned;
- explicit count never overrides safety filtering;
- missing required fatigue context still returns no recommendation rather than guessing;
- requesting more results than are safely eligible does not cause filler recommendations.

---

## 9. Final synthesis

After the bounded recommendation operations finish:

1. collect successful canonical results;
2. collect operation-level failures;
3. pass the bounded result set to Gemini;
4. keep function calling disabled during synthesis;
5. render returned structured refs through the existing canonical card layer.

Gemini must never compensate for a missing result by inventing an in-app recommendation.

---

## Non-goals

This work does not include:

- changing Gemini models;
- changing recommendation datasets;
- changing fatigue/energy zoning;
- changing clinical or safety guidance;
- redesigning recommendation cards;
- increasing the default recommendation count above three;
- unrestricted tool calls;
- autonomous agent loops;
- letting Gemini choose canonical recommendation content;
- unrelated ATHENA UI or architecture refactors.

---

## Acceptance criteria

Implementation is complete when:

- “Show me one recipe” renders exactly one Nutrition card.
- “Show me one exercise” renders exactly one Movement card.
- requests without an explicit quantity preserve the existing up-to-three behaviour.
- “Give me one exercise and one recipe” renders one of each in one response.
- “Show me one card from each” can resolve to one of each when context supports it.
- different quantities can be requested for the two domains.
- both domains continue to use existing deterministic canonical selection and safety logic.
- duplicate same-domain tool calls cannot multiply results.
- a failure in one domain does not discard a successful result from the other.
- Gemini cannot bypass app-controlled recommendation selection.
- existing single-domain regressions continue to pass.
- the real compound-intent failure is represented in regression coverage.

---

## Verification

For behavioural changes:

```bash
pnpm test
pnpm lint
pnpm build
```

A successful Vercel build does not replace the local Vitest regression suite.
