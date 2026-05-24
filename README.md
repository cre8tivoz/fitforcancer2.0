<div align="center">
  <img width="1200" height="475" alt="Fit For Cancer Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Fit For Cancer

Fit For Cancer is a Vite + React + TypeScript web app that provides evidence-based oncology exercise and nutrition support, plus a Gemini-powered assistant for fatigue-aware guidance.

## App Overview

The app is organized into five main sections:

- `Home` for orientation and fatigue-zone context
- `Exercise` for movement cards matched to energy level
- `Nutrition` for recovery recipe cards
- `AI Chat` for Gemini-powered fatigue and symptom guidance
- `Resources` for evidence, support organizations, and safety information

## Tech Stack

- React 19
- TypeScript
- Vite 6
- Tailwind CSS 4
- Framer Motion / Motion
- `@google/genai`
- `vite-plugin-pwa`
- Vercel Serverless Functions

## Current Project State

The project has already been updated with:

- Local exercise imagery mapped into the movement cards
- Local nutrition imagery mapped into 13 recipe cards
- Web-friendly compressed image derivatives stored alongside source PNGs in `media/`
- PWA-compatible asset sizes verified with a successful production build
- Gemini API access moved to a secure backend function in `api/gemini.ts`
- Vercel deployment config and security headers in `vercel.json`

## Media Structure

Source media lives under:

- [media/exercises](C:/fitforcancer/media/exercises)
- [media/nutrition](C:/fitforcancer/media/nutrition)

Working convention used in this repo:

- Original source images can remain as `.png`
- Compressed app-ready images are stored as `.jpg`
- The app imports the compressed `.jpg` versions into [constants.ts](C:/fitforcancer/constants.ts)

Important note:

- Future images added under `media/` should be compressed before being wired into the app

## Nutrition Coverage

Local nutrition images are currently mapped for 13 recipe cards.

The only recipe still using a placeholder image is:

- `Fortified Milky Drink`

Add a matching image to [media/nutrition](C:/fitforcancer/media/nutrition) if you want that final card localized as well.

## Environment Setup

Create a local env file:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Important:

- The frontend does **not** read the Gemini key directly
- `GEMINI_API_KEY` is only used server-side by [api/gemini.ts](C:/fitforcancer/api/gemini.ts)
- For local development with the API route, use Vercel local dev instead of plain `vite`

Security note:

- `.env` is now ignored by git
- Do not commit real API keys to GitHub

## Local Development

Prerequisites:

- Node.js 20+ recommended

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

If you want to test the full app including the Gemini backend locally, use:

```bash
npx vercel dev
```

Default local URL for the Vite-only frontend:

```text
http://127.0.0.1:3000
```

## Build and Verification

Run a production build:

```bash
npm run build
```

Optional type check:

```bash
npm run lint
```

The project has been verified to build successfully after the image and media updates.

## Vercel Deployment

This project is set up for Vercel with:

- static frontend output from Vite
- a root serverless function at [api/gemini.ts](C:/fitforcancer/api/gemini.ts)
- SPA rewrite handling in [vercel.json](C:/fitforcancer/vercel.json)
- production security headers configured in [vercel.json](C:/fitforcancer/vercel.json)

Recommended Vercel settings:

- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`
- Node.js: `20.x` or newer

Required Vercel environment variable:

```text
GEMINI_API_KEY
CHAT_ACCESS_PASSWORD
```

Deploy flow:

1. Push this project to a new GitHub repository.
2. Import the repository into Vercel.
3. Add `GEMINI_API_KEY` in Vercel Project Settings -> Environment Variables.
4. Deploy.

After deployment:

- the React app is served from the Vite build output
- client requests to `/api/gemini` are handled securely on the server
- the Gemini key is never bundled into browser assets
- the AI chat stays locked until the user enters the shared access password

## Key Files

- [App.tsx](C:/fitforcancer/App.tsx) - main app shell and tabbed experience
- [constants.ts](C:/fitforcancer/constants.ts) - recipe and movement library, including local media imports
- [components/MovementCard.tsx](C:/fitforcancer/components/MovementCard.tsx) - exercise card UI
- [components/NutritionCard.tsx](C:/fitforcancer/components/NutritionCard.tsx) - recipe card and recipe modal UI
- [components/Resources.tsx](C:/fitforcancer/components/Resources.tsx) - evidence and support resources
- [services/geminiService.ts](C:/fitforcancer/services/geminiService.ts) - frontend API client for Gemini
- [api/gemini.ts](C:/fitforcancer/api/gemini.ts) - secure Gemini proxy for Vercel
- [vite.config.ts](C:/fitforcancer/vite.config.ts) - Vite and PWA configuration
- [vercel.json](C:/fitforcancer/vercel.json) - Vercel routing, functions, and security headers

## Ready For a New GitHub Repo

Recommended steps before pushing to a new repository:

1. Remove any real secrets from local files before publishing.
2. Confirm `.env` is not tracked.
3. Add an `.env.example` file if you want to document required variables for collaborators.
4. Commit the compressed `.jpg` assets in `media/` if those are the intended production images.
5. Push the project to the new GitHub repository.

Example:

```bash
git init
git add .
git commit -m "Initial Fit For Cancer app"
git branch -M main
git remote add origin <your-new-github-repo-url>
git push -u origin main
```

## License

This project is licensed under the [Apache License 2.0](LICENSE). See the [contributing guidelines](CONTRIBUTING.md) for how you can help.

## Deployment Notes

The project is ready for Vercel deployment as-is. If you deploy elsewhere, you will need an equivalent server-side endpoint for Gemini and equivalent security headers to avoid reintroducing client-side key exposure.
