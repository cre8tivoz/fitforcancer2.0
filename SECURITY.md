# Fit For Cancer Security and Privacy Notes

Fit For Cancer is intentionally lightweight: there are currently no user accounts, no app-owned server database for patient records or ATHENA chat history, and no payment flow inside the app.

That does **not** mean the app handles no health-related data. Some context is stored locally in the browser, and ATHENA conversation/context is transmitted through the server-side Gemini endpoint to generate replies. This document describes those boundaries as they exist in the code.

## Current data model

### Browser-local persisted data

The app currently stores supporting health context in browser storage:

- **Cancer type** — stored in `localStorage` through `utils/patientContextStorage.ts` with a 14-day expiry.
- **Energy Bank history** — stored in `localStorage`, capped to the most recent 30 entries.
- **Fatigue score and fatigue zone** — stored in browser storage for continuity.
- **Daily check-in logged state** — stored in browser storage for continuity.
- **Optional chat access password** — if the server requires one, the entered value is kept in `sessionStorage` for the current browser session.

### ATHENA transcript/draft

ATHENA's active transcript, draft and loading state are kept in React memory through `useAthenaSession`.

They survive normal route navigation because the session is owned by `App.tsx`, above route-level page mounting. They are not intentionally restored after a full page reload and are not written to an app-owned chat database.

### Data sent to Gemini

To generate a reply, `services/geminiService.ts` sends the current chat history plus the applicable `ChatContext` to the server-side `/api/gemini` function. That function sends the request to Gemini.

The Fit For Cancer repository does not implement durable server-side transcript storage, but provider-side processing/retention is a separate concern governed by the configured Gemini service/account. Do not describe the browser-local model as meaning chat content never leaves the device.

## Clear/reset behaviour

The Resources saved-data clear path removes browser-local patient context, Energy Bank history, fatigue/check-in keys and resets ATHENA's in-memory session.

ATHENA uses a request-generation token so an in-flight Gemini request that started before a reset may finish on the network but cannot repopulate the cleared conversation.

Same-origin cross-tab clearing is also handled:

- `useFatigueState` discards this tab's session copies when another tab clears the tracked fatigue/check-in keys;
- `App.tsx` resets the in-memory ATHENA session on the same clear signal;
- initial storage hydration is write-suppressed so opening a new tab cannot briefly remove existing keys and masquerade as a privacy clear.

These behaviours are covered by route/session regressions and should be preserved when changing persistence code.

## Gemini API boundary

`GEMINI_API_KEY` must remain server-side. Browser code talks only to `/api/gemini`.

The handler currently provides:

- POST-only endpoint handling;
- request/history/context validation;
- maximum 40 history messages;
- per-message and total-character limits;
- a 25-second upstream timeout;
- proportional error responses without returning upstream payloads directly;
- production logging that avoids request-history/full-upstream-payload detail;
- first-party recommendation tool execution server-side.

Do not move the Gemini key or tool selection logic into browser code.

## Access gate

An optional shared access gate can be enabled with either:

```text
CHAT_ACCESS_PASSWORD
FFC_CHAT_ACCESS_PASSWORD
```

When configured:

- `/api/gemini` requires `x-chat-access-password`;
- the server compares the supplied/configured values using `timingSafeEqual` after length checking;
- the browser may retain the entered password in `sessionStorage` for the current session;
- leaving the environment variables unset keeps the endpoint in public mode.

This is an access gate, not a substitute for user authentication or an account system.

## Rate limiting

`/api/gemini` is rate-limited by the best available client IP.

Current default policy:

- 20 requests per 10 minutes.

If `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are configured, the app uses an Upstash sliding-window limiter across serverless instances.

If Upstash is unavailable or fails, the handler falls back to best-effort in-memory limiting. That fallback is per-process/serverless-instance behaviour and should not be described as globally durable.

## Recommendation safety boundary

Gemini does not get to invent canonical in-app Movement/Nutrition items.

The server executes deterministic `recommend_movement` / `recommend_recipe` functions against Fit For Cancer-owned recommendation projections. The current fatigue band is applied by the app, and the API returns structured item refs for the browser to resolve against canonical client-side content.

This reduces the risk of the model fabricating an internal item or silently crossing fatigue bands. Changes to that division of responsibility require explicit review.

## AI Elements boundary

The local files under `components/ai-elements/` are source-owned UI adaptations. They do not introduce an AI SDK transport, account storage layer or Next.js server state.

Chat state/privacy remains owned by Fit For Cancer's existing hooks and API flow.

## Secrets

Never commit real `.env` files, API keys, Redis tokens or production access passwords.

At minimum:

```text
GEMINI_API_KEY
```

must exist only in the server environment.

Optional production secrets include:

```text
CHAT_ACCESS_PASSWORD
FFC_CHAT_ACCESS_PASSWORD
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
```

## Contribution rules for health/chat data

Do not introduce new logging, analytics, persistence, cloud transcript storage or third-party transmission of health/chat content as an incidental implementation detail.

Any new account/cloud-history design should be scoped separately and document:

- explicit user opt-in;
- data fields stored;
- retention;
- deletion;
- authentication/authorisation;
- cross-device behaviour;
- what is sent to the AI provider;
- what remains browser-local.

## Verification

For security-sensitive behavioural changes run:

```bash
pnpm test
pnpm lint
pnpm build
```

Dependency/security review can additionally use:

```bash
pnpm audit
```

A successful production build does not substitute for the separate Vitest regression suite.

For the full ATHENA lifecycle see [`docs/athena-architecture.md`](docs/athena-architecture.md).
