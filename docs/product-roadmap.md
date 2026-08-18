# Fit For Cancer Product Roadmap

_Last reconciled: August 2026_

Fit For Cancer has moved beyond its original “exercise + nutrition + chatbot” shape. The current product direction makes **ATHENA the hero and main driver**: a treatment-day companion that can converse naturally, explain general treatment information, and connect people to real first-party Movement and Nutrition content without turning the language model into the source of truth for app recommendations.

This roadmap separates the foundation that is already built from the next product decisions.

## Current product foundation — shipped

### Fatigue-aware app core

- Green / Yellow / Red fatigue-band model across Movement and Nutrition.
- 21 Movement items and 17 Nutrition recipes in the current recommendation catalogues.
- browser-local fatigue score/zone continuity.
- browser-local cancer-type context with a 14-day expiry.
- Energy Bank with up to 30 recent check-ins.
- clear-saved-data controls.

### ATHENA conversational layer

- Gemini-backed treatment-day conversation through a server-side API route.
- concise, plain-language Australian tone calibrated for treatment fatigue/cognitive load.
- general chat is a valid first-class mode; ATHENA does not force every conversation into an intervention.
- graduated treatment-information framework: explain and compare generally, but do not make personal treatment decisions or dose/schedule changes.
- cancer-type and blood-cancer-family routing for treatment-information context.
- verified Australian treatment/evidence sources available when requested or materially useful.
- natural-cure / unproven-treatment replacement boundary.
- proportional symptom-safety behaviour rather than blanket clinical disclaimers.

### ATHENA session architecture

- active transcript, draft and loading state survive normal route navigation.
- chat history remains memory-only; no account or durable transcript database.
- reset/privacy clear invalidates in-flight replies so stale network completions cannot restore cleared chat.
- same-origin cross-tab saved-data clears also reset ATHENA.
- storage hydration is guarded so opening another tab cannot accidentally masquerade as a privacy clear.

### First-party recommendation tools

- `recommend_movement` and `recommend_recipe` function declarations available to Gemini.
- deterministic Fit For Cancer-owned catalogue selection.
- current fatigue band enforced server-side.
- generic recommendations do not automatically downgrade a Green/Yellow user to seated/lying-down activity merely because they have cancer.
- same-band fallback if a preference has no match.
- no recommendation if fatigue context is unavailable.
- catalogue-parity regressions protect copied server projection fields.

### Recommendation cards and hand-off

- structured `{kind, id}` recommendation refs returned with ATHENA replies.
- canonical Movement/Nutrition cards rendered inside the assistant message.
- stale/invalid refs render nothing rather than invented content.
- deep links open the exact item in the main library.
- target item can temporarily override stale filters, then normal filtering resumes after user interaction.
- linked items receive focus/highlight for accessibility.
- full conversation export includes canonical recommendation details.

### AI-chat surface

- source-owned Vercel AI Elements composition adapted to the existing Vite/Gemini app.
- `Conversation`, `Message`, `PromptInput` and `Suggestion` patterns.
- multiline composer with Enter-to-send and Shift+Enter newline.
- IME-safe submit behaviour.
- voice dictation retained.
- composer remains editable while ATHENA responds so users can draft the next message.
- live-edge behaviour that does not pull the user down if they scroll back.
- jump-to-latest control stays overlaid outside the scrolling viewport.

### Security / deployment foundation

- Gemini key server-side only.
- request validation and history-size limits.
- optional password gate for restricted chat deployments.
- rate limiting with optional Upstash Redis and in-memory fallback.
- production Gemini error logging avoids request-history/full-payload logging.
- Vercel + Vite deployment model with PWA support.

## Current priority — make ATHENA the main product experience

The next phase should consolidate what has just been built rather than immediately adding a second large architecture.

### 1. ATHENA-first product flow

**Goal:** Make ATHENA feel like the natural starting point and connective tissue of Fit For Cancer, while keeping Movement, Nutrition, Energy Bank and Resources useful as independent destinations.

Likely work includes:

- review onboarding/home hierarchy now that ATHENA has materially more capability;
- make the transition between conversation and first-party app content feel deliberate and low-friction;
- identify which existing Fit For Cancer capabilities should become additional deterministic ATHENA tools rather than being duplicated in prompts;
- keep tool outputs app-owned and structured rather than asking Gemini to invent internal state/content.

Any new tool should preserve the rule established by the recommendation system:

> ATHENA interprets intent and explains; Fit For Cancer owns deterministic app state, canonical content and safety-critical selection.

### 2. Beta-readiness pass

**Goal:** Harden the current experience before widening use.

Focus areas:

- end-to-end mobile interaction review;
- accessibility and keyboard/screen-reader pass across ATHENA and deep-linked cards;
- regression coverage for high-risk session/privacy/tool boundaries;
- failure-state and slow-network review;
- current evidence/resource-link audit as sources evolve;
- user-facing privacy language checked against the actual browser/Gemini data flow;
- remove stale copy that still describes ATHENA as a secondary “AI chat” feature.

### 3. Recommendation quality tuning

**Goal:** Make real catalogue recommendations feel appropriate rather than merely technically correct.

Focus areas:

- test generic Green/Yellow/Red recommendation requests in realistic conversations;
- check preference inference without allowing cancer status alone to cause unnecessary downgrading;
- review whether the current deterministic ordering produces enough useful variation;
- add or adjust catalogue metadata only when the canonical Movement/Nutrition library supports it;
- keep safety concerns capable of overriding a generic recommendation request when the conversation genuinely warrants it.

## Deliberately later — accounts and cloud chat history

Accounts/cloud persistence are **not** the next incremental extension of `useAthenaSession`.

If durable ATHENA history is introduced later, it should be a separate product/privacy project covering at minimum:

- explicit opt-in;
- what health/chat data is stored;
- retention period;
- deletion controls;
- authentication/security model;
- cross-device behaviour;
- what remains browser-local;
- clear user-facing explanation of data sent to the AI provider versus data stored by Fit For Cancer.

The current memory-only transcript model should remain the baseline until that work is intentionally designed.

## Out of scope unless separately approved

- migrating the app to Next.js just to use AI UI components;
- replacing Gemini simply to adopt another chat SDK;
- allowing the model to choose arbitrary exercises/recipes outside the canonical catalogue;
- turning ATHENA into an autonomous open-ended agent loop;
- cloud transcript storage by accident or as a side effect of unrelated UI work;
- treatment-prescribing or diagnostic functionality.

## Maintenance rule

This roadmap should describe the **current decision horizon**, not preserve completed work as if it is still pending. When a major ATHENA/product milestone lands, move it into the shipped foundation and rewrite the active priorities rather than appending another numbered version checklist.
