<div align="center">
  <img width="1200" height="475" alt="Fit For Cancer Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Fit For Cancer

Fit For Cancer is a free, evidence-informed treatment-day support app for people living through cancer treatment and cancer-related fatigue. It combines fatigue-aware movement, practical nutrition, recent energy check-ins, verified Australian resources, and **ATHENA** — the app's conversational treatment-day companion.

ATHENA is now the main connective layer across the product. She can talk naturally about treatment days, fatigue, food, movement and general treatment information, and can recommend real Movement and Nutrition items already built into Fit For Cancer. The app — not the language model — decides which catalogue items are eligible for the user's current fatigue band.

## Product Surfaces

- **Home** — orientation and today's fatigue context.
- **Movement** — 21 fatigue-banded movement options with practical safety notes.
- **Nutrition** — 17 fatigue-banded recipes covering high-protein, easy-to-digest, hydrating, anti-nausea, zero-prep and quick-assembly needs.
- **Energy Bank** — recent browser-local check-ins for spotting treatment-day patterns.
- **ATHENA** — conversational support, general treatment information, and first-party Movement/Nutrition recommendations.
- **Resources** — evidence sources, Australian support organisations, privacy information and saved-data controls.

## ATHENA in the Current Architecture

ATHENA is deliberately useful without pretending to be a clinician.

- She may **explain** general cancer-treatment categories and terminology.
- She may **compare** treatment approaches in general terms when the supplied evidence supports it.
- She does **not decide** which treatment a person should start, stop, switch, skip or alter.
- She does not diagnose symptoms or recommend replacing evidence-based treatment with an unproven cure.
- Sources stay underneath ordinary conversation and are surfaced when the user asks for evidence or when attribution materially improves an answer.

For concrete Movement or Nutrition recommendations, Gemini can call two first-party Fit For Cancer tools:

- `recommend_movement`
- `recommend_recipe`

Those functions deterministically filter the app-owned catalogue to the user's current Green, Yellow or Red fatigue band. Gemini interprets intent and explains the result; Fit For Cancer owns the actual item selection, IDs and safety metadata.

ATHENA responses stream through the server-side `/api/gemini` endpoint. Normal conversational text appears progressively; when Gemini requests a first-party Movement/Nutrition tool, Fit For Cancer executes the deterministic selection first and then streams the synthesis response. Structured recommendation references arrive at completion and render as real in-chat cards.

Users can open the exact Movement or Nutrition item in the main app, where the linked item is highlighted and focused. Normal Movement/Nutrition navigation starts at the top of the page; explicit ATHENA recommendation links are the exception because they intentionally navigate to the target card.

See [ATHENA architecture](docs/athena-architecture.md) for the full request/session/tool/streaming flow and [ATHENA + AI Elements](docs/athena-ai-elements.md) for the chat UI boundary.

## Session and Privacy Model

Fit For Cancer currently has **no account system and no app-owned server database for chat history**.

- ATHENA transcript and draft state live in memory and survive normal route navigation within the current app session.
- Refreshing/reloading the app does not intentionally restore ATHENA chat history.
- Resetting or clearing saved browser data invalidates any in-flight ATHENA response so an old request cannot repopulate a cleared conversation.
- A same-origin clear in another tab also resets ATHENA's in-memory session and local fatigue context.
- Cancer type is stored browser-side with a 14-day expiry.
- Energy history is stored browser-side and capped at the most recent 30 entries.
- Fatigue score/zone and daily-check-in state use browser storage for continuity.
- Chat requests are sent through the server-side `/api/gemini` endpoint to Gemini to generate responses; the Gemini API key is never exposed to browser code.

Cloud chat history, accounts and durable transcript storage are **not part of the current product** and require a separate privacy/product design before implementation.

## Chat UI

ATHENA's chat surface uses source-owned components adapted from the official Vercel AI Elements project:

- `Conversation`
- `Message`
- `PromptInput`
- `Suggestion`

This keeps the official AI-chat composition model while preserving the existing Vite/Gemini architecture. There is no Next.js migration and no AI SDK transport migration.

The transcript has its own responsive scroll viewport and follows streamed replies while the user remains at the live edge. If the user scrolls back, ATHENA does not force the transcript to the newest content; a jump-to-latest control is available instead.

The current composer supports multiline drafts (`Enter` sends; `Shift+Enter` adds a new line) and voice dictation where supported. It remains editable while ATHENA is responding so the next thought can be drafted without starting a concurrent request.

Per-message PDF buttons are intentionally omitted. Conversation-level export/PDF controls remain outside the transcript so download actions do not repeat beneath every ATHENA response.

## Tech Stack

- React 19
- TypeScript
- Vite 6
- Tailwind CSS 4
- React Router
- Vercel Serverless Functions
- Gemini 2.5 Flash via Google Generative Language API
- `@google/genai` elsewhere in the project tooling/dependencies
- Vitest + Testing Library
- `vite-plugin-pwa`
- Recharts
- jsPDF
- Upstash rate limiting when configured, with an in-memory fallback

## Key Architecture Files

- [`App.tsx`](App.tsx) — routes, shared fatigue state and app-level ATHENA session ownership.
- [`components/AthenaChatPage.tsx`](components/AthenaChatPage.tsx) — ATHENA conversation surface, streaming message updates and user interactions.
- [`components/ai-elements/`](components/ai-elements/) — local source-owned AI Elements adaptations.
- [`hooks/useAthenaSession.ts`](hooks/useAthenaSession.ts) — memory-only transcript/draft/loading state and request-generation invalidation.
- [`hooks/useFatigueState.ts`](hooks/useFatigueState.ts) — fatigue/cancer context hydration, persistence and cross-tab clearing.
- [`services/geminiService.ts`](services/geminiService.ts) — browser SSE/JSON client for `/api/gemini` and structured recommendation refs.
- [`api/gemini.ts`](api/gemini.ts) — server-side Gemini orchestration, prompt/safety framework, SSE streaming, request validation and tool round.
- [`utils/treatmentInformation.ts`](utils/treatmentInformation.ts) — graduated general treatment-information layer and Australian source routing.
- [`utils/athenaRecommendations.ts`](utils/athenaRecommendations.ts) — deterministic Movement/Nutrition recommendation projections and function declarations.
- [`movements.ts`](movements.ts) — canonical frontend `MOVEMENTS` catalogue.
- [`constants.ts`](constants.ts) — canonical frontend `RECIPES` catalogue; also re-exports `MOVEMENTS` from `movements.ts`.
- [`utils/patientContextStorage.ts`](utils/patientContextStorage.ts) — browser-local cancer context and Energy Bank persistence.
- [`components/AthenaRecommendationCard.tsx`](components/AthenaRecommendationCard.tsx) — canonical recommendation cards/deep links.

## Environment Setup

The project uses pnpm and Node 24.x as declared in `package.json`.

Create a local environment file from `.env.example`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
CHAT_ACCESS_PASSWORD=
```

`GEMINI_API_KEY` is server-side only. `CHAT_ACCESS_PASSWORD` is optional; when set, `/api/gemini` requires the matching `x-chat-access-password` header and the browser keeps the entered password in `sessionStorage` for that tab/session.

Optional durable rate limiting can be configured with:

```env
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

Without Upstash, the API falls back to best-effort in-memory limiting.

## Local Development

Install dependencies:

```bash
pnpm install
```

Run the Vite frontend:

```bash
pnpm dev
```

To exercise the Vercel serverless API locally, run the project through Vercel dev rather than relying on Vite alone.

## Verification

Run the complete local verification set when changing behaviour:

```bash
pnpm test
pnpm lint
pnpm build
```

`pnpm test` runs the Vitest regression suite. `pnpm lint` is the TypeScript no-emit check. `pnpm build` validates the production Vite bundle.

The regression suite covers core app smoke paths plus fatigue-zone logic, Energy Bank behaviour, Gemini request validation, treatment/blood-cancer routing, deterministic recommendation tools, streamed direct/tool responses, structured recommendation cards/deep links, page-entry scroll behaviour, chat exports, route-level ATHENA session continuity/privacy invalidation, and the AI Elements chat surface.

## Deployment

The production architecture is Vercel-oriented:

- Vite builds the static frontend into `dist`.
- `/api/gemini` runs as a serverless function and supports ATHENA's SSE response stream.
- the Gemini API key remains server-side.
- security headers and SPA rewrites are configured in `vercel.json`.
- optional Upstash-backed rate limiting can persist across serverless instances.

If deployed elsewhere, the host needs an equivalent server-side Gemini endpoint and streaming/security controls; do not move the Gemini key into browser code.

## Documentation

- [Current product roadmap](docs/product-roadmap.md)
- [ATHENA architecture](docs/athena-architecture.md)
- [ATHENA + AI Elements](docs/athena-ai-elements.md)
- [Security notes](SECURITY.md)
- [Contributing](CONTRIBUTING.md)

## License

Fit For Cancer is licensed under the [Apache License 2.0](LICENSE).
