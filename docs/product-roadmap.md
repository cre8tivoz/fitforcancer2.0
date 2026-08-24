# Fit For Cancer Product Roadmap

_Last reconciled: 25 August 2026_

Fit For Cancer has moved beyond its original “exercise + nutrition + chatbot” shape. The current product direction makes **ATHENA the hero and main driver**: a treatment-day companion that can converse naturally, explain general treatment information, and connect people to real first-party Movement and Nutrition content without turning the language model into the source of truth for app recommendations.

The current architecture is now stable enough that the next phase is primarily **human validation across cancer types and public-beta readiness**, not another large rebuild.

## Current product foundation — shipped

### Fatigue-aware app core

- Green / Yellow / Red fatigue-band model across Movement and Nutrition.
- 21 Movement items and 17 Nutrition recipes in the current recommendation catalogues.
- browser-local fatigue score/zone continuity.
- browser-local cancer-type context with a 14-day expiry.
- Energy Bank with up to 30 recent check-ins.
- clear-saved-data controls.

### ATHENA conversational layer

- Gemini 2.5 Flash treatment-day conversation through a server-side API route.
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

### Streaming integrity

- real Gemini SSE streaming for normal and tool-backed responses.
- app-level `delta`, `reset`, `error` and terminal `done` contract.
- provisional first-pass prose is cleared if a later function call requires a tool-backed synthesis response.
- strict malformed/truncated/post-terminal stream rejection on the browser side.
- strict malformed/semantically invalid upstream Gemini stream handling on the server side.
- CRLF/network-boundary regressions covered.
- a completed app response requires a valid terminal upstream completion rather than merely receiving some text.

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
- mobile ATHENA header actions wrap safely rather than causing horizontal document overflow.

### Exports

- plain-text ATHENA transcript download sits below the composer as a single low-noise action.
- transcript export includes canonical Movement/Nutrition recommendation metadata.
- caregiver PDF remains a separate header action with a different purpose from the raw transcript.
- caregiver PDF layout rebuilt for readable typography, header/footer boundaries and multi-page flow.
- long check-in notes split safely across pages with repeated table headings.
- PDF text sanitisation preserves clinically meaningful symbols/relationships when transliterating for jsPDF's built-in Helvetica limitations.

### Mobile hardening

- iOS form-control font sizing prevents unwanted Safari input zoom without disabling user pinch zoom.
- Nutrition and Movement filters are constrained against horizontal document overflow.
- ATHENA mobile header actions wrap without shifting the page horizontally.
- Movement/Nutrition route entry and ATHENA-target scrolling have explicit regression coverage.

### Public information architecture

- six primary app destinations remain Home, Movement, Nutrition, Energy Bank, ATHENA and Resources.
- refreshed `/about` page explains the lived-experience origin and current product.
- dedicated `/support` page keeps optional contributions separate from core app use.
- Ko-fi is the external support surface; no in-app payment flow or fake fundraising meter.
- About and Support are secondary hamburger/footer destinations rather than new primary product tabs.
- legacy `/why-free` redirects to canonical `/about`.
- user-facing privacy disclosure now distinguishes browser-local data from paid Gemini API processing and provider logs.

### Security / deployment foundation

- Gemini key server-side only.
- request validation and history-size limits.
- optional password gate for restricted chat deployments.
- rate limiting with optional Upstash Redis and in-memory fallback.
- production Gemini error logging avoids request-history/full-payload logging.
- paid Gemini API project with 14-day project-log retention configured outside the repository.
- Vercel + Vite deployment model with PWA support.
- Node 24.x aligned across package metadata, `.node-version` and Vercel runtime configuration.

## Current priority — cross-cancer human validation

The technical architecture is now ahead of the validation sample. Human testing should deliberately broaden before ATHENA's core prompt is tuned again.

### 1. Cross-cancer conversation matrix

**Goal:** Confirm that ATHENA's current behavioural standard holds outside the blood-cancer/myeloma scenarios that have received the most attention so far.

Test realistic conversations across at least:

- breast cancer;
- prostate cancer;
- lung cancer;
- bowel/colorectal cancer;
- melanoma;
- other/unspecified cancer contexts;
- blood cancers beyond explicit myeloma where routing differs.

For each cancer context, test several conversation shapes rather than a single treatment question:

- “what happens if this treatment stops working?”;
- “what other treatments are there?”;
- treatment terminology and appointment preparation;
- side-effect/fatigue conversation;
- nutrition and movement requests;
- ordinary treatment-day chitchat;
- ambiguous questions where stage, biomarkers, treatment line or other context materially changes the answer.

**Success criteria:** ATHENA should ask a small, useful clarifying question when necessary, stay specific enough to be useful, and avoid either guessing personalised treatment decisions or collapsing into generic chemotherapy/radiotherapy/immunotherapy lists when established context supports a more relevant answer.

### 2. Resist premature prompt tuning

**Goal:** Preserve the current “happy medium” while collecting enough evidence to distinguish a recurring behaviour from a one-off answer.

Current tuning rule:

- log quality observations during human testing;
- avoid changing the core prompt for isolated wording preferences;
- prioritise repeated failure patterns across multiple conversations/cancer contexts;
- prefer targeted routing/evidence/prompt corrections over broad tone rewrites;
- protect the existing **Explain → Compare → Don't decide** treatment boundary.

Known observations worth watching, but not yet sufficient on their own to justify broad prompt changes:

- occasional over-confident interpretation of a user's reported test results;
- occasional validation-heavy phrasing;
- answers that fall back to generic cancer-treatment categories after a more specific cancer/treatment context has already been established.

### 3. Public-beta readiness

**Goal:** Make the current build comfortable to promote beyond the existing test group.

Remaining focus areas:

- real-device mobile review across iOS/Android and common viewport sizes;
- accessibility/screen-reader pass across ATHENA, navigation and recommendation hand-off;
- slow-network and failure-state review using the hardened stream contract;
- confirm the 14-day Gemini provider-log setting remains aligned with the public privacy disclosure;
- verify About/Support/Ko-fi routes and privacy links after deployment changes;
- watch production AI usage/cost rather than adding artificial conversation limits prematurely;
- evidence/resource-link maintenance as external sources evolve.

### 4. Recommendation quality tuning

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
- treatment-prescribing or diagnostic functionality;
- in-app payment/donation identity as an incidental extension of the current external Ko-fi support link.

## Maintenance rule

This roadmap should describe the **current decision horizon**, not preserve completed work as if it is still pending. When a major ATHENA/product milestone lands, move it into the shipped foundation and rewrite the active priorities rather than appending another numbered version checklist.
