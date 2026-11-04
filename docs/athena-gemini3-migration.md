# Athena Gemini 3.5 Flash-Lite migration

Status: initial Flash-Lite migration completed on 3 November 2026. The broader 4 November evaluation selects full Gemini 3.6 Flash; see `evaluations/athena-model-quality-2026-11-04.md`. The sections below retain the initial migration record.

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

Automated mocks verify request construction and error handling. Live preview checks
used synthetic inputs with the existing paid project, through both transports:

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
No comparative model benchmark was performed; these checks evaluate this migration.

Before 1 December a previous deployment can be restored for temporary rollback.
After the redirect, reverting to the 2.5 model string does not restore 2.5
behaviour; retain Gemini 3-compatible configuration and use a validated model.

## Official references

- https://aistudio.google.com/docs/deprecations
- https://aistudio.google.com/docs/whats-new-gemini-3.6#api-changes-and-parameter-updates
- https://aistudio.google.com/docs/whats-new-gemini-3.6#migrate-to-gemini-3-5-flash-lite
- https://aistudio.google.com/docs/thinking
- https://github.com/google-gemini/gemini-skills/blob/main/skills/gemini-api-dev/SKILL.md

## Validation results — 3 November 2026

- 301 tests pass across 41 files, including eight added fault checks for the
  25-second request deadline and rejected upstream requests in both transports,
  JSON and streaming. Pre-stream failures return an HTTP error; started SDK
  streams report an error without a success event.
- TypeScript checking and production build pass.
- Initial Codex review on `55099ee` completed without findings.
- Live legacy preview: `dpl_Gx28hPKgXNun3sAzLvfxLKE4JU6e`.
- Live SDK preview: `dpl_CY9bQGtRYQDMspd5qtgtYTQb6cRp`; branch-only
  ATHENA_TRANSPORT=sdk makes the review preview match production's transport.
- Both previews use the same application tree. Greeting, combined catalogue
  calls, follow-up conversation, fatigue 8 and 10, and clinical-decision refusal
  were exercised. JSON responses and streaming completion were inspected.
- Browser checks at fatigue 7 and 8 confirmed rendered catalogue cards, working
  follow-ups and treatment/dose refusal, without visible thinking text.
- SDK server diagnostics: seven successful sampled requests finished with STOP,
  zero recovery calls, 1.834–5.799 seconds server time, 4,114–10,066 input tokens
  and 499–1,690 output tokens per request. Tool requests used two calls. These
  are synthetic samples, not a production latency or billing guarantee.
- SDK client timings for six successful model cases were 5.11–9.86 seconds,
  including network overhead. No truncation or missing-signature errors observed.
- Faults and interrupted/truncated stream handling were verified with controlled
  automated tests; failures were not deliberately injected into Google's service.

Quality observation: the low-energy catalogue sometimes returns a cooler or shake
for an easy-meal request, and the model may call that a meal. Follow-up requests
can offer several catalogue cards despite mentioning only two in prose. These
are recorded limitations of recommendation quality, not evidence that all
clinical or conversational behaviour has been exhaustively validated. Clinical
choice and dosing requests were refused in the tested conversations.

## CI security-audit follow-up

The original Verify job passed install, type checking, 301 tests and build, but
failed its high-severity dependency audit (12 high and 2 critical findings).
The earlier deployment-success report did not establish overall CI success.

Updated DOMPurify, Better Auth and its support libraries, Zod, Undici, Vite and
Happy DOM to patched versions, with the lockfile regenerated using pnpm 10.34.5.
The high-severity audit gate is unchanged. Local audit now reports zero high and
zero critical findings (4 low and 8 moderate remain below the configured gate).
Private tuning calls now pass explicit request options required by the patched
auth client. Component tests use Motion's JavaScript animation fallback because
Happy DOM 21 rejects canceled native-animation promises during test cleanup.
