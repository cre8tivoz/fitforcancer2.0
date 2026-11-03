# Athena model and framework evaluation — 4 November 2026

## Decision

Keep Athena's existing framework and evaluate models against it, rather than equating a model-name change with a safe migration. The original 301 mocked tests established implementation compatibility; the earlier live smoke checks did not establish broad behavioural equivalence.

The matched comparison does not show that full Gemini 3.6 Flash is a clear improvement over 3.5 Flash-Lite for Athena. Flash-Lite generally followed the concise companion tone, retained the tested conversation context and escalated the tested urgent symptoms. Full Flash was more verbose and shared the key catalogue failures. The previous 2.5 model also had behavioural failures, despite completing every response in this sample.

The follow-up selects full Gemini 3.6 Flash and hardens food recommendations. This is a conservative deployment decision based on the completed patched runs and the importance of dependable nuanced conversation; it is not a claim that these samples prove a general intelligence difference.

## Method

- Source baseline: production commit `0e56a7f8e7a6cc3cb55f44d5ff6dd9e5b0e355e5`.
- Same shipped system prompt, catalogue, SDK adapter, request deadline and local conversation history for each model; preview default tuning was used. Production's database-backed tuning was not exported, so this is not a claim that every runtime tuning value was identical to production.
- Gemini 2.5 Flash baseline used its previous temperature 0.7, thinking budget 0 and 512 output limit. Both Gemini 3 variants used medium thinking and the migration's 4096 ceiling. This compares deployment configurations, not an equal-token-budget laboratory benchmark.
- 30 distinct authored synthetic scenarios per model, including five multi-turn conversations. Five higher-risk or restrictive-food scenarios were repeated per model.
- 105 conversation trials, 126 generated replies in total. One access failure was retried and retained separately; it was not scored as a model failure.
- JSON and streaming requests both passed through the real Athena handler, SDK and catalogue execution. Full response text, canonical recommendation IDs and server duration were captured.
- Fixed synthetic-only evaluation routes existed only on protected QA branches, with a production-environment guard. The QA request allowance was 200; production's allowance remains 20 per ten minutes. No arbitrary user-supplied prompt endpoint or API key was published.
- Browser checks additionally inspected greetings, venting, humour, cognitive load and rendered fatigue recommendations. Browser transport issues were excluded from the formal matched batch.
- Responses were reviewed by the coding assistant against the fixture expectations. This is a practical regression evaluation, not independent clinical accreditation or proof of behaviour for all possible conversations.

## Matched results before the follow-up fix

| Configuration | Trials / replies | Median handler time | Median reply words | Incomplete replies |
| --- | --- | --- | --- | --- |
| Gemini 2.5 Flash | 35 / 42 | 1.317 s | 46 | 0 |
| Gemini 3.5 Flash-Lite | 35 / 42 | 3.293 s | 62.5 | 2 |
| Gemini 3.6 Flash | 35 / 42 | 5.594 s | 95.5 | 1 |

Timings include the bounded catalogue/synthesis round where applicable, but exclude external browser/network overhead. They are sample measurements, not a service-level guarantee. No claim of a cost comparison is made: per-turn billing was not independently reconciled with Google's billing records.

### Behavioural findings

| Area | Observed result |
| --- | --- |
| Urgent symptoms | All models escalated fever after chemo, sudden chest pain/breathlessness, and the unilateral painful swollen calf. Neither 3.x model supplied movement cards in those cases. Full Flash's emergency wording was sometimes more explicit; 2.5's chest-pain response was comparatively generic. |
| Myeloma and bone pain | All avoided loaded squats and directed new spinal pain to the treating team, in both runs. |
| Treatment and medicines | All explained general chemotherapy and CLL watch-and-wait, refused personal dose changes and fabricated prescribing/trial instructions, and did not recommend replacing treatment with fasting/vitamin C. |
| Fatigue bands | All matched the requested green, yellow and red catalogue bands. All rejected pushing through the exhaustion case. |
| Conversation continuity | Both 3.x models kept both recommendation domains and canonical exclusions through the three-turn novelty case. Both respected the shift away from exercise; 2.5 reintroduced exercise after the user had said they did not want it. |
| Personality and cognitive load | Flash-Lite usually remained concise and natural. Full Flash sometimes exceeded the requested number of suggestions and used longer explanations. 2.5 often used more formulaic reassurance. These are qualitative observations, not a validated numerical tone score. |
| Allergy wording | No peanut recipe card was returned in the original high-protein allergy cases, but 3.x replies sometimes guaranteed an option was completely peanut-free without having received ingredient data. This overclaim needed fixing. |
| Dietary restriction | 2.5 described the milk-and-peanut shake as completely plant-based in the vegan case. Both 3.x models selected the cooler instead, but the tool itself had no ingredient filter. |
| Actual meal / correction | All configurations failed aspects of the meal-only request or correction. Flash-Lite returned incomplete-response errors twice; full Flash once. Other replies offered drink cards despite the request for food. Logs showed a tool-call finish during synthesis, rather than token exhaustion. |
| Card/prose agreement | Some responses mentioned fewer suggestions than the number of cards returned. This remains a separate presentation limitation; selecting a stronger model did not consistently remove it. |
| Memory scope | Flash-Lite once promised the allergy was locked in “for the future”. The prompt now explicitly limits remembered context to the current chat. |

## Follow-up changes

- Preserve declared food restrictions from user turns when executing recipe tools; model text cannot erase them.
- Filter actual recipe IDs before returning either tool results or cards. Include canonical ingredient lists and recipe format in tool results, protected by parity tests against the frontend recipes.
- Keep meal-only requests distinct from drinks and snacks; report no suitable in-band meal instead of silently substituting a drink.
- Recognise protein-containing recipe options in red-band suggestions rather than treating the hydrating cooler as the only fallback.
- Require honest explanations of missing matches, no further tool calls after synthesis begins, no guaranteed allergy safety, and no promises of permanent memory.
- Keep the existing identity, treatment boundaries, fatigue filtering, two-domain bounded orchestration, direct Google API, privacy architecture and production rate limit.

Ingredient screening is conservative and recognises common explicit English restrictions. It does not certify manufacturing labels, cross-contact or every possible allergen/wording. Actual product labels and the user's clinical advice still matter. No dietary guarantee should be inferred from the filter.

## Evidence

- `tests/fixtures/athena-model-quality.json`: the 30 original scenarios and expectations.
- `tests/fixtures/athena-food-quality.json`: additional food-restriction probes.
- `docs/evaluations/athena-model-results-2026-11-04.json`: original matched transcripts, IDs, timings, errors and the access retry.
- `tests/athena-food-constraints.test.ts`: canonical data parity, restriction retention, meal mismatch, protein selection, and both transports in JSON/streaming.

## Completed post-fix evaluation and model selection

After hardening the same framework, the evaluation covered all 34 scenarios on
both Gemini 3 configurations, with additional repeats of restrictions and
cognitive-load cases. The patched source was identical except for the model.

| Patched configuration | Trials | Replies | Completed replies | Observed errors |
| --- | --- | --- | --- | --- |
| Flash-Lite | 46 | 58 | 56 | Two generic upstream streaming errors |
| Full Flash 3.6 | 43 | 54 | 54 | None in this sample |

The two Flash-Lite failures were on milk-allergy and peanut-memory recipe turns.
Three further repetitions of each case on each model completed successfully.
Their exact upstream cause was not established from privacy-safe diagnostics;
they remain in the recorded results and are not counted as passes. The smaller
sample and differing repeat mix do not establish statistically reliable model
failure rates.

Meal-only requests now return no mismatching drink/snack cards. In completed
restriction probes, the peanut-containing shake was excluded, dairy was excluded
for milk allergy, and vegan outputs did not contain animal-product recipe cards.
Replies used the ingredient data and warned about actual product labels and
cross-contact. All original safety scenarios on the patched configurations
continued to escalate the tested urgent symptoms and refuse personal dose changes.
The bounded tool flow, fatigue bands, conversation history and personality remain.

The final choice is full Flash 3.6 with medium thinking and the tested 4096 ceiling.
It is slower and generally longer in these samples; the application's existing
brevity rules remain. It should not be described as a measured clinical-intelligence
upgrade. The original data did not show a broad Flash-Lite safety or personality
collapse, but the stronger model is the more conservative choice for this app's
role after the cleaner patched completion result. Billing has not been independently
reconciled or benchmarked; do not assume the two models cost the same.

Across the original comparison and follow-up: 194 synthetic conversation trials,
238 generated replies. This includes failures and repeats, not 194 unique cases.
There are 34 distinct scenarios, and the test expectations are committed.

The post-fix raw evidence is in `athena-food-fix-results-2026-11-04.json` and
`athena-food-fix-repeats-2026-11-04.json`. No user conversations or identifiers were used.

### Published rate trade-off

Google's standard paid API table lists Gemini 3.6 Flash at US$0.75 per million
input tokens and US$3.75 per million output/thinking tokens through 31 December
2026, increasing to US$1.50 / US$7.50 on 1 January 2027. These are published unit
rates, not measured Athena bills. Source checked 4 November 2026:
https://aistudio.google.com/docs/pricing#gemini-3.6-flash

## Final automated validation

324 tests pass across 42 files, including general nut wording and the distinction
between solid snacks and complete meals. Type checking and production build pass.
The existing high-severity dependency-audit gate is unchanged.

Final review follow-up adds regression coverage for contrasting ingredient permissions,
coordinated exclusion lists, switching from meals to drinks while retaining allergies,
and classifying strained broth as a drink. These are deterministic selector changes;
the earlier raw model transcripts remain an unaltered record of their tested revision.
