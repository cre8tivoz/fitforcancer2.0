# Athena Gemini 3.5 Flash-Lite migration

Status: implementation candidate; live model evaluation and release approval pending.

Google's 3 November 2026 account notice redirects `gemini-2.5-flash` to
`gemini-3.5-flash-lite` on 1 December 2026. The public deprecation page now
also documents the redirect. Text pricing is unchanged per token; thinking
can still increase tokens consumed per conversation.

## Scope and decisions

- Explicitly select `gemini-3.5-flash-lite` for both existing transports.
- Keep Generate Content, the current SDK pins, local conversation history,
  catalogue tools, prompt, safety boundaries and transport rollout switch.
- Replace numeric thinking budget with `thinkingLevel: "medium"`, following
  Google's tool-calling migration guidance. Remove temperature.
- Share configuration between transports. Raise the combined thinking/output
  ceiling from 512 to 4096 as a provisional test setting; this is not a measured
  optimum. Keep the existing 25-second whole-request deadline and bounded calls.
- Reject requests ending with an assistant or blank user turn before Google.
- Filter thinking text from direct API replies and accept signature-only SSE
  events. Keep complete model parts for the within-request tool round trip.
- Verify signed tool calls and matching response IDs through the real pinned
  SDK with mocked HTTP responses, in both streaming and JSON handlers.

Completed exchanges in browser history remain text plus catalogue references;
there are no partial tool calls in that history. Within a request, the complete
provider response is retained through tool synthesis. This does not implement
cross-request persistence of model signatures. Preview testing must include
multiple follow-up turns; if Google requires additional history metadata in
this flow, address that before release rather than bypass signature checks.

No Interactions API or server-side conversation storage is introduced. This
change does not verify or alter the existing Google project's retention settings.

## Release gate

Automated mocks verify request construction and error handling, not model tone,
clinical appropriateness, actual token usage or latency. This workspace has no
Gemini API key. Use a preview configured with the existing paid project to test:

| Scenario | Check |
| --- | --- |
| Greeting and ordinary follow-up | Warm, concise Australian voice and continuity |
| Fatigue 7, 8 and 10 | Existing appropriate catalogue filtering and safety boundaries |
| Recipe and movement together | Both tools complete, cards match the answer |
| “Another one” after recommendations | Earlier references honoured; no unwanted repeats |
| Treatment or diagnosis request | Existing clinical boundaries retained |
| Direct answer and tool answer, JSON and streaming | No 400s, missing signatures, thinking leakage or truncation |
| Interrupted stream, timeout and upstream rejection | Clear failure; no false success |

Record completion, latency, token counts and reviewer observations using only
synthetic inputs. Check `MAX_TOKENS` and the 25-second deadline explicitly.
Compare 3.6 Flash with the same prompt only if Flash-Lite fails the quality gate;
this PR makes no claim about comparative live quality. Do not merge merely
because mocked tests pass.

Before 1 December a previous deployment can be restored for temporary rollback.
After the redirect, reverting to the 2.5 model string does not restore 2.5
behaviour; retain Gemini 3-compatible configuration and use a validated model.

## Official references

- https://aistudio.google.com/docs/deprecations
- https://aistudio.google.com/docs/whats-new-gemini-3.6#api-changes-and-parameter-updates
- https://aistudio.google.com/docs/whats-new-gemini-3.6#migrate-to-gemini-3-5-flash-lite
- https://aistudio.google.com/docs/thinking
- https://github.com/google-gemini/gemini-skills/blob/main/skills/gemini-api-dev/SKILL.md
