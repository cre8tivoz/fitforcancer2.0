# Fit For Cancer

Fit For Cancer is a free, open-source Australian web app for people living through cancer treatment and cancer-related fatigue.

It combines practical movement, nutrition, energy check-ins and **ATHENA** — an AI-powered treatment-day guide designed to make evidence-informed support easier to understand and use when someone may be tired, overwhelmed or simply not in the mood for another clinical-looking website.

The project is built from lived experience, is free for users, and has no paid features or advertising.

> Fit For Cancer does not replace an oncology team, GP, dietitian, physiotherapist or other qualified health professional. ATHENA provides general information and practical support, not diagnosis or treatment decisions.

## ATHENA

ATHENA is the main connective layer across Fit For Cancer.

She is deliberately plain-speaking and non-clinical. She can help users talk through treatment-day questions, fatigue, movement and food, then connect them with real Movement and Nutrition items already built into the app.

ATHENA does not get to invent those in-app recommendations. Fit For Cancer owns the catalogue, fatigue-band rules, safety metadata and final item selection; the language model interprets what the user is asking and explains the result.

That separation is intentional. It lets ATHENA feel conversational without handing safety-critical product behaviour to a model.

## What is in the app

- **ATHENA** — conversational treatment-day support and guidance.
- **Movement** — fatigue-aware exercise and movement options with practical safety notes.
- **Nutrition** — recipes and food ideas designed around common treatment-day needs.
- **Energy Bank** — simple browser-local check-ins for noticing fatigue patterns.
- **Resources** — Australian evidence sources, support organisations and privacy information.
- **About** — the lived-experience story behind the project.

## Why open source?

Fit For Cancer is intended to be a public-good project, not another health subscription.

Keeping the code open makes the product easier to inspect, improve and challenge. It also gives designers, developers and people with useful experience a practical way to contribute to something that remains free for the people using it.

The project is Australian-first in its language, resources and health-system context.

## Where we would most value help

We are particularly interested in contributors who can help with:

1. **Design and UX** — improving the visual system, cards, mobile experience, accessibility and overall ease of use without increasing cognitive load.
2. **ATHENA's AI framework and reliability** — stronger model orchestration, streaming behaviour, tool use, failure handling, testing and ways to make the assistant more dependable.
3. **Overall web-app reliability** — regression coverage, accessibility, performance, browser edge cases and graceful failure states.

If that sounds useful, start with [CONTRIBUTING.md](CONTRIBUTING.md).

## Privacy in plain language

Fit For Cancer currently has no user accounts and no app-owned server database for ATHENA chat history.

Some context, including fatigue and Energy Bank information, is stored in the user's browser. ATHENA requests are sent through a server-side API boundary to the configured AI provider so a response can be generated.

The browser does not receive the model API credential, and the app does not intentionally attach a user's name or email address to ATHENA requests. Users should still avoid putting unnecessary identifying information into any AI conversation, particularly health information.

See [SECURITY.md](SECURITY.md) for the current technical and privacy boundaries.

## Local development

Fit For Cancer uses Node 24.x and pnpm.

```bash
pnpm install
pnpm dev
```

To exercise ATHENA locally, create a local environment file based on `.env.example` and run the project through Vercel dev so the serverless API route is available.

Run the full verification set with:

```bash
pnpm test
pnpm lint
pnpm build
```

## Current stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Vercel Serverless Functions
- Gemini 2.5 Flash behind the server-side ATHENA API boundary
- Vitest + Testing Library
- Optional Upstash rate limiting

The AI-provider implementation is an infrastructure detail rather than the product itself. ATHENA's product behaviour, app-owned recommendation logic and safety boundaries should remain clear even if that infrastructure changes in future.

## Technical documentation

- [ATHENA architecture](docs/athena-architecture.md)
- [ATHENA + AI Elements](docs/athena-ai-elements.md)
- [Recommendation correctness](docs/athena-recommendation-correctness.md)
- [Product roadmap](docs/product-roadmap.md)
- [Security and privacy notes](SECURITY.md)
- [Contributing](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)

## Licence

Fit For Cancer is licensed under the [Apache License 2.0](LICENSE).

---

Built by Witch Daddy Labs in Melbourne, Australia.
