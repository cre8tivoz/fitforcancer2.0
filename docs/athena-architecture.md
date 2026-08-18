# ATHENA Architecture

ATHENA is Fit For Cancer's treatment-day companion and the main conversational layer over the app's existing Movement, Nutrition, fatigue and evidence content.

This document describes the architecture after the August 2026 ATHENA work. It is intended to be the canonical technical boundary for session state, Gemini orchestration, streaming, treatment-information behaviour, first-party recommendation tools and in-app recommendation cards.

## Product role

ATHENA is not a separate general-purpose chatbot bolted onto Fit For Cancer. She is the conversational interface over first-party app capabilities.

Current first-class conversation modes include:

- practical treatment-day conversation and general chitchat;
- fatigue-aware Movement support;
- fatigue-aware Nutrition support;
- general cancer-treatment information and terminology;
- source/evidence requests using verified Australian resources.

ATHENA is evidence-informed but does not diagnose and does not make personal treatment decisions.

The treatment boundary is deliberately graduated:

1. **Explain** — general treatment categories, terminology and broad pathways are allowed.
2. **Compare** — general differences can be explained when the supplied evidence supports the comparison.
3. **Decide** — ATHENA must not tell a person which treatment they personally should choose, start, stop, skip, replace or switch.
4. **Dose/schedule** — ATHENA must not recommend changing prescribed medicine dose, timing, frequency or schedule.

The main implementation lives in `api/gemini.ts`, with treatment-source routing in `utils/treatmentInformation.ts` and evidence material in `utils/clinical_guidelines.ts` / `utils/verifiedResources.ts`.

## High-level request flow

```text
ATHENA UI
  ↓
useAthenaSession + fatigue/cancer context
  ↓
services/geminiService.ts
  ↓ POST /api/gemini   Accept: text/event-stream
api/gemini.ts
  ├─ request validation / rate limit / optional password gate
  ├─ clinical + treatment + verified-resource prompt blocks
  ├─ Gemini streaming first pass with first-party function declarations
  │    ├─ no tool needed → stream text deltas to ATHENA
  │    └─ tool call(s) requested
  │          ↓
  │      Fit For Cancer executes deterministic catalogue functions
  │          ↓
  │      Gemini streaming synthesis pass with function calling disabled
  ↓
SSE delta events + done {recommendations: [{kind, id}]}
  ↓
ATHENA message updates progressively + canonical recommendation cards
  ↓
Movement / Nutrition deep link to exact app item
```

There is intentionally no open-ended autonomous agent loop. A user turn can produce one tool round followed by one synthesis call.

A JSON response path remains available for non-streaming/backwards-compatible callers and tests. ATHENA itself requests the SSE path.

## Session ownership

`App.tsx` owns one `useAthenaSession()` instance and passes it into the `/assistant` route.

That hook owns:

- `messages`;
- draft `input`;
- loading state;
- whether the conversation has started;
- a request-generation token used to invalidate stale asynchronous replies.

Because the session is owned above route-level page mounting, navigating from ATHENA to Movement, Nutrition or another route and back does not destroy the active transcript or draft.

### Streaming message lifecycle

When a user sends a message, ATHENA creates one pending model message in session state. Before the first text delta arrives the UI may show a thinking state. Each streamed delta replaces the content of that same pending message with the accumulated response.

When streaming completes, the final text and any structured recommendation refs replace that same message. Partial chunks are not stored as separate chat turns.

The existing request-generation token remains authoritative during streaming. If a session is invalidated while a network request is still producing chunks, stale chunks and completion are ignored by the UI.

### What is deliberately not persisted

ATHENA transcript history is **not** written to `localStorage`, `sessionStorage`, a database or a cloud account.

Normal route navigation preserves it because the React state remains mounted at app level. A full reload does not intentionally restore it.

Cloud transcript history and accounts are a separate future product/privacy decision, not an extension of the current route-continuity mechanism.

## Reset and privacy invalidation

`useAthenaSession` maintains a monotonically increasing generation token.

When ATHENA is reset or saved browser data is cleared:

1. the generation increments;
2. transcript/draft/loading state is reset;
3. any request that started under an older generation may still finish on the network, but its chunks/completion are ignored.

This prevents a late Gemini response from repopulating a conversation the user has already cleared.

`App.tsx` also listens for same-origin `storage` removal events affecting the saved fatigue/check-in keys. A clear performed in another browser tab resets this tab's in-memory ATHENA session as well.

`useFatigueState` suppresses persistence writes until initial browser-storage hydration is complete. This prevents a newly opened tab's temporary null state from looking like a genuine privacy clear to another tab.

## Browser-local health context

ATHENA chat history is memory-only, but some supporting app context is deliberately browser-local:

- cancer type is stored by `utils/patientContextStorage.ts` with a 14-day expiry;
- Energy Bank history is browser-local and capped to the most recent 30 entries;
- fatigue score, fatigue zone and daily-check-in state are persisted for continuity.

The Resources surface exposes the saved-data clear path, which clears browser-local context/history and resets ATHENA's in-memory session.

## Gemini boundary

The browser never calls Gemini with an exposed API key.

`services/geminiService.ts` sends the current `ChatMessage[]` plus `ChatContext` to `/api/gemini`. For ATHENA, it requests `text/event-stream` and consumes app-level SSE events. The serverless handler owns:

- `GEMINI_API_KEY`;
- optional access-password verification;
- request-size/history validation;
- rate limiting;
- prompt construction;
- Gemini `streamGenerateContent` orchestration;
- first-party function declarations and execution;
- Gemini stream parsing and app-level SSE output.

The endpoint currently accepts at most 40 history messages, with per-message and total-character limits.

The same 25-second request timeout covers the full turn, including a second synthesis stream when a first-party tool is used.

The app itself does not operate a server-side transcript database. Requests are still transmitted to Gemini to generate a response, so provider-side data handling is distinct from Fit For Cancer's browser-storage model.

## Streaming contract

ATHENA's app-level SSE response uses a deliberately small contract:

- `event: delta` — carries the next text fragment;
- `event: done` — marks successful completion and carries any structured recommendation refs;
- `event: error` — carries a user-safe error once a stream has already begun.

Authentication, request validation and rate limiting run before the SSE response starts. If those checks fail, `/api/gemini` can still return an ordinary HTTP/JSON error response.

If Gemini returns normal conversational text on the first pass, those chunks are forwarded as they arrive. If Gemini requests a first-party tool, Fit For Cancer executes the tool first and streams the second synthesis response. The deterministic tool boundary is therefore preserved; streaming does not move catalogue selection into the model.

## First-party recommendation tools

ATHENA currently exposes two deterministic app tools to Gemini:

- `recommend_movement`
- `recommend_recipe`

Their implementation is in `utils/athenaRecommendations.ts`.

### Division of responsibility

**Gemini owns:**

- understanding the user's natural-language intent;
- deciding whether a first-party recommendation tool is useful;
- choosing a small preference enum such as `walking`, `strength`, `zero_prep` or `high_protein`;
- explaining returned options conversationally.

**Fit For Cancer owns:**

- the current fatigue band;
- the eligible catalogue;
- item IDs and titles;
- the actual deterministic selection;
- canonical card content and safety notes;
- whether a requested preference matched.

Gemini must not invent an in-app item or override the server-side fatigue band.

### Fatigue-band behaviour

The current Green/Yellow/Red band is authoritative for recommendation selection.

A generic request such as “recommend an exercise” uses `preference: any`. ATHENA must not infer a seated or lying-down recommendation merely because the user has cancer or is receiving treatment.

If a specific preference has no match in the current band, the function returns other same-band items and marks the preference as unmatched rather than silently crossing into another band.

If no current fatigue band exists, the recommendation functions return no items instead of guessing an effort level.

## Catalogue parity

The serverless recommendation projection intentionally omits frontend-only assets such as images and detailed instructions.

`MOVEMENT_RECOMMENDATION_CATALOG` and `RECIPE_RECOMMENDATION_CATALOG` mirror the fields needed by the Gemini tool round. Regression tests compare those copied fields against the canonical frontend `MOVEMENTS` and `RECIPES` data so catalogue drift is detected.

Current recommendation coverage is 21 Movement items and 17 Nutrition recipes.

## Structured recommendation refs

The streamed completion event may contain refs shaped as:

```ts
{ kind: 'movement' | 'recipe', id: string }
```

The browser validates and deduplicates these refs. It does not trust Gemini-provided presentation data.

`AthenaRecommendationCard` resolves the ref against the canonical client-side catalogue and renders the real item image, metadata and safety note. Unknown/stale IDs render nothing.

Opening a recommendation navigates to the corresponding Movement or Nutrition page, temporarily exposes the target even if an old manual filter would hide it, focuses/highlights it, and then returns control to normal filtering as soon as the user changes a filter/search control.

Conversation export resolves recommendation refs back through the canonical catalogue so exported text contains the same recommendation details shown in the UI.

## Route and scroll behaviour

Normal entry to the Movement or Nutrition routes resets the document to the top. This prevents React Router's retained document scroll position from making a newly opened catalogue appear to start halfway down or at the bottom.

An explicit ATHENA recommendation deep link (`?athena=<id>`) is the intentional exception. That route skips the top reset so the page can focus and scroll to the exact recommended card.

Changing a filter or search control after arriving through ATHENA clears the deep-link exception and returns the page to normal filtering behaviour.

## Chat surface

The visual conversation layer is source-owned and adapted from official Vercel AI Elements components. See `docs/athena-ai-elements.md` for details.

The current surface includes:

- `Conversation` with a definite responsive, internally scrollable viewport;
- live-edge following for streamed responses;
- `Message` and `MessageContent`;
- `PromptInput` multiline composer;
- `Suggestion` starter actions;
- an overlaid jump-to-latest control outside the scrolling viewport;
- voice dictation where supported;
- recommendation cards attached to the assistant message that produced them.

Per-message PDF controls are intentionally omitted. Conversation-level export/PDF controls remain available outside the transcript.

The textarea remains editable while ATHENA is responding so the user can draft their next message. The submit and voice controls remain blocked during the active request, and `onSendMessage` also rejects concurrent sends.

## Testing expectations

Changes to ATHENA should preserve regressions around:

- server request validation and error handling;
- SSE chunk parsing and incremental client rendering;
- direct streamed replies and streamed tool synthesis;
- treatment-information and blood-cancer routing;
- deterministic same-band recommendation selection;
- catalogue parity;
- Gemini function-call/function-response correlation;
- structured recommendation refs and stale-ref handling;
- cards/deep links/filter hand-off;
- normal Movement/Nutrition page-entry scroll vs explicit ATHENA targeting;
- conversation exports and absence of repeated per-message download actions;
- route-level transcript/draft continuity;
- local and cross-tab privacy clears;
- stale in-flight response invalidation;
- storage hydration safety;
- AI Elements keyboard, focus and scroll behaviour.

For behavioural changes run:

```bash
pnpm test
pnpm lint
pnpm build
```

## Future boundary

ATHENA may become even more central to navigation and first-party Fit For Cancer capabilities, but future tools should follow the same rule established here:

> **ATHENA can interpret and explain; Fit For Cancer owns deterministic app state, content and safety-critical selection.**

Accounts or durable cloud chat history must be scoped separately with explicit retention, deletion, consent and privacy decisions rather than being added implicitly to the current session hook.
