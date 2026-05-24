# Contributing to Fit For Cancer

First off — thank you for wanting to help. This app exists because someone wished it existed when they needed it, and every contribution helps keep it alive for the next person.

## Our License

This project is licensed under the [Apache License 2.0](LICENSE). By contributing, you agree that your contributions will be licensed under the same license.

## What We're Looking For

- **Bug fixes** — especially around energy tracking, zone logic, and data persistence
- **Accessibility improvements** — WCAG compliance, screen reader support, keyboard navigation
- **UI polish** — the app works but could always look and feel better
- **Documentation** — better comments, README improvements, user guides
- **Test coverage** — we have almost none, and we need it
- **Translation** — making the app accessible to non-English speakers

## What Needs Maintainer Approval

The following changes **require explicit approval from the maintainer** before merging:

- **Clinical content changes** — anything that affects health recommendations, zone thresholds, or medical guidance
- **Data model changes** — modifications to localStorage schema, check-in structure, or patient context
- **New dependencies** — any new npm package needs a security and necessity review
- **Architecture changes** — new routes, major refactors, or changes to the Gemini integration

When in doubt, open an issue first and ask.

## How to Contribute

1. **Fork the repo**
2. **Create a branch** — `feature/your-feature-name` or `fix/your-fix-name`
3. **Make your changes** — keep them scoped and focused
4. **Test locally** — `npm run build` must pass, and manually verify your change works
5. **Open a Pull Request** — describe what you changed and why

## Code Standards

- TypeScript — no `any` types unless absolutely necessary
- Tailwind CSS — use existing design tokens from `index.css`, don't add arbitrary values
- Component pattern — match existing component structure (functional components, hooks)
- Accessibility — all interactive elements need proper `aria` labels and keyboard support
- No PII — never log, store, or transmit personally identifiable information

## Code of Conduct

Be respectful. This app is for people going through cancer treatment. Keep that in mind in all interactions — issues, PRs, and discussions.

## Contributor License Agreement

By submitting a pull request, you confirm that:

- You have the right to submit the code under the Apache 2.0 license
- You are not contributing code you don't have permission to share
- You understand your contribution will be publicly available under Apache 2.0

## Questions?

Open an issue with the `question` label. We'll get back to you.

---

Built with ❤️ by [Witch Daddy Labs](https://witchdad.ly) — Melbourne, Australia
