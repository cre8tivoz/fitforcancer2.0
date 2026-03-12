# Security Best Practices Report

## Executive Summary

This review covered the React + TypeScript + Vite frontend in `C:\fitforcancer` against the applicable frontend guidance from the local `security-best-practices` skill and against relevant OWASP ASVS themes for configuration, secrets handling, communications, and client-side security.

The most serious issue is a confirmed secret exposure path: the Gemini API key was present in a local env file and also embedded into the generated browser bundle because the current design passes `GEMINI_API_KEY` into client-side code at build time. That means the key is not protectable in the current frontend-only architecture.

I scrubbed the local repo state by replacing the real value in `.env`, adding `.env.example`, and the remaining required fix is architectural: move Gemini calls behind a backend or serverless endpoint so no secret is ever shipped to the browser.

## Scope

- Frontend React application
- Build configuration
- Gemini integration
- Static HTML entrypoint
- Generated build output risk

## Critical Findings

### 1. Secret exposure in browser-delivered code

- Rule ID: REACT-CONFIG-001
- Severity: Critical
- OWASP ASVS:
  - V1 Architecture, Design and Threat Modeling
  - V8 Data Protection
  - V14 Configuration
- Location:
  - [vite.config.ts](C:/fitforcancer/vite.config.ts#L70)
  - [services/geminiService.ts](C:/fitforcancer/services/geminiService.ts#L98)
  - [security_best_practices_report.md](C:/fitforcancer/security_best_practices_report.md)
- Evidence:

```ts
define: {
  'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
  'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
}
```

```ts
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
```

- Impact: Any user of the app can extract the Gemini API key from the built JavaScript bundle or network/devtools inspection and use it outside the application.
- Fix: Remove direct Gemini access from the frontend. Move model access to a backend or serverless API route that reads the secret server-side and returns only model responses to the browser.
- Mitigation: Until a backend exists, do not build or deploy this app with a production Gemini secret. Rotate the previously used Gemini key because it was exposed in generated output.
- False positive notes: None. This is a confirmed exposure pattern and was previously observed in built output.

### 2. Real API key was stored in repo-local secret file

- Rule ID: JS-STORAGE-001 / REACT-CONFIG-001
- Severity: Critical
- OWASP ASVS:
  - V8 Data Protection
  - V14 Configuration
- Location:
  - [`.env`](C:/fitforcancer/.env#L1)
- Evidence:

```env
GEMINI_API_KEY=replace_with_local_secret
```

- Impact: A real secret in a working-copy file can be accidentally committed, copied into logs, bundled into builds, or leaked during screen sharing or support workflows.
- Fix: Keep only placeholders in repo-local examples and inject real secrets through local developer environment or deployment platform secret storage.
- Mitigation: `.env` is git-ignored, which helps, but it does not make the current browser-side design safe.
- False positive notes: The secret value has now been scrubbed locally by this review, but it existed before the scrub.

## High Findings

### 3. Missing CSP and other visible browser hardening controls

- Rule ID: JS-CSP-001 / REACT-CSP-001 / REACT-HEADERS-001
- Severity: High
- OWASP ASVS:
  - V9 Communications
  - V14 Configuration
- Location:
  - [index.html](C:/fitforcancer/index.html#L1)
- Evidence:

```html
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
```

- Impact: If a DOM XSS or third-party script compromise occurs, there is no visible Content Security Policy or related browser hardening in app code to reduce blast radius.
- Fix: Add a production CSP at the server or hosting edge. At minimum, define a restrictive `script-src`, `connect-src`, `img-src`, and `style-src`, and set clickjacking and referrer controls at the hosting layer.
- Mitigation: If these headers are already configured in deployment infrastructure, verify them at runtime and document that configuration in the repo.
- False positive notes: This repo does not show server or CDN header configuration, so runtime hosting may already add protections. That needs explicit verification.

### 4. Third-party code is loaded from external CDNs without visible SRI or CSP constraints

- Rule ID: JS-SUPPLY-001 / JS-SRI-001 / REACT-SRI-001
- Severity: High
- OWASP ASVS:
  - V1 Architecture, Design and Threat Modeling
  - V14 Configuration
- Location:
  - [index.html](C:/fitforcancer/index.html#L8)
- Evidence:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

```html
<script type="importmap">
{
  "imports": {
    "@google/genai": "https://esm.sh/@google/genai@^1.40.0",
```

- Impact: External dependency compromise or tampering at runtime has broad impact in a browser app, especially without CSP constraints or integrity checks.
- Fix: Prefer bundling dependencies locally through Vite rather than runtime import maps from `esm.sh`, and self-host or tightly govern external resources where possible.
- Mitigation: If external resources remain, constrain them with CSP and use SRI where supported.
- False positive notes: Some third-party use is expected in web apps, but the current posture lacks visible hardening.

## Medium Findings

### 5. Service worker can cache a build that contains sensitive configuration if the app is built insecurely

- Rule ID: REACT-SW-001
- Severity: Medium
- OWASP ASVS:
  - V9 Communications
  - V14 Configuration
- Location:
  - [vite.config.ts](C:/fitforcancer/vite.config.ts#L17)
- Evidence:

```ts
VitePWA({
  registerType: 'autoUpdate',
```

- Impact: Once a build containing embedded secrets is produced, the service worker can help persist and distribute that bundle to clients.
- Fix: Do not build with embedded secrets; after moving Gemini calls server-side, keep service-worker caching limited to safe static assets as it is now.
- Mitigation: Remove old `dist` artifacts and rebuild only after the secret architecture is corrected.
- False positive notes: The service worker itself is not the root cause; it amplifies the impact of the current secret-handling design.

## Informational Findings

### 6. No direct DOM XSS sink usage found in the reviewed source files

- Rule ID: REACT-XSS-001 / REACT-DOM-001
- Severity: Informational
- OWASP ASVS:
  - V5 Validation, Sanitization and Encoding
- Location:
  - [App.tsx](C:/fitforcancer/App.tsx)
  - [components/NutritionCard.tsx](C:/fitforcancer/components/NutritionCard.tsx)
  - [components/MovementCard.tsx](C:/fitforcancer/components/MovementCard.tsx)
  - [components/Resources.tsx](C:/fitforcancer/components/Resources.tsx)
- Evidence: The reviewed UI code uses normal React rendering and did not show `dangerouslySetInnerHTML`, `innerHTML`, `eval`, or `document.write` in application source.
- Impact: This reduces current client-side XSS exposure compared with many frontend apps.
- Fix: Keep using React’s default escaping behavior and avoid introducing raw HTML rendering without sanitization.
- Mitigation: Add CSP as defense-in-depth.
- False positive notes: This conclusion applies to reviewed application source, not arbitrary future content or infrastructure.

## Actions Already Taken In This Review

- Replaced the real value in [`.env`](C:/fitforcancer/.env)
- Added [`.env.example`](C:/fitforcancer/.env.example)
- Identified the browser-bundle secret exposure path

## Recommended Next Steps

1. Rotate the previously used Gemini API key immediately.
2. Move Gemini requests to a backend or serverless endpoint.
3. Rebuild only after the secret is fully server-side.
4. Add and verify production security headers at the hosting layer:
   - `Content-Security-Policy`
   - `X-Content-Type-Options: nosniff`
   - `Referrer-Policy`
   - clickjacking protection via `frame-ancestors` and/or `X-Frame-Options`
5. Remove runtime dependency loading from external import maps if practical.
