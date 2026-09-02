# Contributing to Fit For Cancer

Thanks for wanting to help.

Fit For Cancer is a free, open-source app for people dealing with cancer treatment and fatigue. Contributions should make the product easier to use, more reliable and safer without turning it into an over-engineered health platform.

## Where we most need help

### 1. Design and UX

This is a current priority.

Useful contributions include:

- improving the visual hierarchy and consistency of Movement, Nutrition and ATHENA surfaces;
- making cards easier to scan on mobile;
- reducing unnecessary labels, chips and interaction clutter;
- improving spacing, typography and responsive behaviour;
- strengthening keyboard, focus and screen-reader behaviour;
- reducing cognitive load for tired users;
- improving empty, loading, error and recovery states.

Small, focused polish is welcome. For larger redesigns or changes to navigation/information architecture, open an issue first so the direction can be agreed before significant work is done.

### 2. ATHENA's AI framework and reliability

ATHENA is the main conversational layer in Fit For Cancer, and this is the other major area where outside help is useful.

We are interested in work that improves:

- model orchestration and provider boundaries;
- streaming reliability and malformed-response handling;
- first-party tool calling and function-response correctness;
- compound requests and multi-tool behaviour;
- deterministic recommendation hand-off;
- useful fallback behaviour when the model or provider fails;
- regression testing against real failure modes;
- model/provider portability without weakening the product's safety boundaries.

The aim is not to make ATHENA more complicated. The aim is to make her more dependable.

Before working on ATHENA, read:

- [ATHENA architecture](docs/athena-architecture.md)
- [ATHENA + AI Elements](docs/athena-ai-elements.md)
- [Recommendation correctness](docs/athena-recommendation-correctness.md)
- [Security notes](SECURITY.md)

### 3. Overall app reliability

Also useful:

- bug fixes;
- browser and mobile edge cases;
- accessibility;
- focused test coverage;
- performance improvements that do not add unnecessary dependencies;
- privacy/session edge cases;
- documentation that keeps shipped behaviour and technical docs aligned;
- verified Australian resource-link maintenance.

## The important ATHENA rule

The established product boundary is:

> **ATHENA interprets intent and explains; Fit For Cancer owns deterministic app state, canonical content and safety-critical selection.**

For example, a language model may understand that someone wants a simple high-protein meal, but Fit For Cancer decides which real recipes are eligible for that user's current fatigue band.

Do not move canonical recommendation selection, fatigue-band enforcement or safety metadata into a model prompt.

## Changes that need maintainer discussion first

Please open an issue before implementing changes to:

- clinical or safety guidance;
- symptom escalation language;
- treatment-information boundaries;
- ATHENA's core prompt, tone or treatment-decision rules;
- model/provider architecture;
- recommendation tool contracts or fatigue-band enforcement;
- accounts, cloud sync or durable chat storage;
- browser-storage schemas involving health/context data;
- analytics involving chat or health content;
- external provider logging or retention behaviour;
- new runtime dependencies;
- exports or any server-side upload of exported data;
- payments or donation-linked identity;
- major routes, navigation or canonical data models.

This is not intended to block useful work. These areas affect health information, privacy or core product behaviour, so they need a deliberate review.

## Development setup

The repo uses:

- Node `24.x`
- pnpm `10.34.5`

Install dependencies:

```bash
pnpm install
```

Run the frontend:

```bash
pnpm dev
```

For local work that requires ATHENA's serverless API route, run the project through Vercel dev and configure a local environment file from `.env.example`.

## Verification before a pull request

For behavioural changes, run:

```bash
pnpm test
pnpm lint
pnpm build
```

A successful build is not a substitute for the test suite.

When fixing a bug, add or update a regression test where practical. Good tests should reproduce the real failure mode rather than assert incidental implementation details or CSS classes.

Areas with existing regression coverage include:

- fatigue-score and fatigue-band behaviour;
- Energy Bank/browser persistence;
- ATHENA request validation and error handling;
- treatment-information routing;
- recommendation tools and catalogue parity;
- streaming integrity;
- recommendation cards and deep links;
- ATHENA session continuity and privacy resets;
- exports;
- mobile layout and navigation;
- accessibility-sensitive chat interactions.

## Code standards

- Use TypeScript.
- Avoid `any` unless an untyped external boundary genuinely requires it and the value is validated immediately.
- Reuse existing design tokens and component patterns.
- Preserve touch targets, accessible names, focus visibility and keyboard behaviour.
- Prefer deterministic app logic over asking the model to own canonical state or content.
- Keep secrets server-side.
- Do not log or persist chat/health payloads without explicit review.
- Avoid new dependencies when a small existing solution will do the job.

## A note on prompt changes

ATHENA is tested through repeated human conversations, not just prompt inspection.

Do not rewrite the core prompt because of one odd answer or stylistic preference. If behaviour is genuinely wrong, first capture a reproducible example, identify whether the problem belongs in app logic, tool logic or model instructions, then add a regression where possible.

## Pull requests

Keep PRs focused.

A useful PR description should explain:

- the user problem;
- what changed;
- what deliberately did not change;
- how the change was verified;
- whether privacy, safety, health content or external dependencies are affected.

## Licence

Fit For Cancer is licensed under the [Apache License 2.0](LICENSE). By contributing, you agree that your contribution will be licensed under the same licence.

By submitting a pull request, you confirm that you have the right to submit the contribution and are not contributing code or content you do not have permission to share.

## Code of conduct

Please read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before contributing. The short version: be respectful, coordinate significant changes, and remember this project exists to support people going through cancer treatment and the people caring for them.

## Questions

Open an issue with the `question` label if you are unsure whether a change needs discussion first.

---

Built by Witch Daddy Labs in Melbourne, Australia.
