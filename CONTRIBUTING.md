# Contributing to Fit For Cancer

Thank you for wanting to help. Fit For Cancer is built for people dealing with cancer treatment and fatigue, so contributions should favour low cognitive load, accessibility, predictable behaviour and clear safety boundaries over unnecessary complexity.

## License

This project is licensed under the [Apache License 2.0](LICENSE). By contributing, you agree that your contribution will be licensed under the same licence.

## Current architecture in brief

Fit For Cancer is a Vite + React 19 + TypeScript app with browser-local fatigue/context features and a Vercel serverless Gemini endpoint.

ATHENA is the main conversational layer. Her active transcript is memory-only, while selected supporting context (such as fatigue state, cancer type and Energy Bank entries) is stored browser-side. Movement/Nutrition recommendations are selected deterministically by Fit For Cancer functions rather than invented by Gemini.

Before changing ATHENA, read:

- [`docs/athena-architecture.md`](docs/athena-architecture.md)
- [`docs/athena-ai-elements.md`](docs/athena-ai-elements.md)
- [`SECURITY.md`](SECURITY.md)

## What contributions are useful

- **Bug fixes** — especially session/privacy edge cases, fatigue-zone logic, deep links and failure states.
- **Accessibility** — screen-reader behaviour, focus management, keyboard navigation, reduced interaction burden and mobile ergonomics.
- **Test coverage** — focused regressions around real failure modes.
- **Documentation** — keeping product/architecture/privacy docs aligned with shipped code.
- **Performance** — improvements that preserve behaviour and avoid unnecessary dependencies.
- **Content maintenance** — verified resource-link updates or carefully reviewed canonical Movement/Nutrition content.
- **Translation/localisation groundwork** — when scoped so medical/safety meaning is not lost.

## Changes that require explicit maintainer approval

Open an issue or discuss the approach before implementing any of the following:

- **Clinical/safety content** — health guidance, symptom escalation, fatigue thresholds, treatment information or source changes.
- **ATHENA prompt/behaviour** — tone, treatment-decision boundaries, evidence behaviour, cancer-family routing or safety rules.
- **Recommendation logic** — changing fatigue-band enforcement, tool contracts, canonical catalogue metadata or what Gemini is allowed to choose.
- **Persistence/privacy** — any new `localStorage`/`sessionStorage` schema, durable transcript storage, accounts, cloud sync, analytics involving health/chat content or retention changes.
- **Gemini/API architecture** — model/provider changes, tool-loop changes, request history limits or server-side data handling.
- **New dependencies** — every runtime package needs a necessity/security review.
- **AI Elements architecture** — replacing local source-owned components, introducing AI SDK/Next.js dependencies or materially changing the chat-state boundary.
- **Major routes/data models** — significant app-shell or canonical-content restructuring.

When in doubt, ask first.

## Development setup

The repo declares:

- Node `24.x`
- pnpm `10.34.5`

Install dependencies:

```bash
pnpm install
```

Run the Vite frontend:

```bash
pnpm dev
```

For local testing that requires `/api/gemini`, use Vercel dev so the serverless route and environment variables are available.

## Verification before a pull request

For behavioural changes, run:

```bash
pnpm test
pnpm lint
pnpm build
```

- `pnpm test` runs Vitest.
- `pnpm lint` runs the TypeScript no-emit check.
- `pnpm build` validates the production Vite bundle.

Do not treat a successful Vercel/Vite build as proof that the Vitest suite ran; they are separate checks.

### Regression expectations

The repo now has meaningful regression coverage. Preserve and extend tests when touching:

- fatigue-score/band logic;
- Energy Bank/browser persistence;
- Gemini handler validation and error behaviour;
- treatment-information and blood-cancer routing;
- first-party recommendation tools and catalogue parity;
- Gemini function-call/function-response correlation;
- recommendation refs/cards/deep links and exports;
- ATHENA route-level session continuity;
- local and cross-tab privacy clears;
- stale in-flight response invalidation;
- storage hydration;
- AI Elements composer, keyboard/focus and scroll behaviour.

A good regression reproduces the failure mode that motivated the change, not just a CSS class or implementation detail.

## Code standards

- Use TypeScript; avoid `any` unless the boundary genuinely requires untyped external data and it is validated immediately.
- Reuse existing Tailwind design tokens and component patterns.
- Keep touch targets, keyboard navigation, focus visibility and accessible names intact.
- Prefer deterministic app logic for canonical content/state over pushing responsibility into the language model.
- Do not duplicate Movement/Nutrition titles, safety notes or other canonical presentation data into prompts when an app-owned structured reference can be used instead.
- Keep server secrets server-side.
- Do not introduce logging or new persistence of chat/health information without explicit review.

## ATHENA-specific rule of thumb

The established architecture is:

> **ATHENA interprets intent and explains; Fit For Cancer owns deterministic app state, canonical content and safety-critical selection.**

For example, Gemini may infer that someone wants a high-protein option, but the app-owned recommendation function decides which current-band recipes are real and eligible.

## Updating AI Elements

The files under `components/ai-elements/` are source-owned adaptations of official Vercel AI Elements components.

Do not overwrite them blindly with upstream files. Compare upstream deliberately, preserve Fit For Cancer's Vite/Gemini/session architecture, and add regressions for any interaction changes. See [`docs/athena-ai-elements.md`](docs/athena-ai-elements.md).

## Pull requests

Keep PRs focused. The recent ATHENA architecture was deliberately built as separate changes for treatment behaviour, session continuity, recommendation tools, recommendation cards and chat UI; continue that discipline when a change crosses meaningful product boundaries.

A useful PR description should state:

- what user problem is being fixed;
- what behaviour changed;
- what explicitly did **not** change;
- what regression/verification covers the change;
- whether privacy, safety, clinical content or external dependencies are affected.

## Code of conduct

Be respectful and practical. This app is for people going through cancer treatment, and some users may be tired, frightened or cognitively foggy. Product and contributor communication should not create unnecessary friction.

## Contributor licence statement

By submitting a pull request, you confirm that:

- you have the right to submit the contribution;
- you are not contributing code/content you do not have permission to share;
- you understand the contribution will be available under Apache License 2.0.

## Questions

Open an issue with the `question` label when a change needs discussion before implementation.

---

Built by Witch Daddy Labs in Melbourne, Australia.
