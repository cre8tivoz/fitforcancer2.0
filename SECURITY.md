# Fit For Cancer Security Notes

Fit For Cancer is intentionally lightweight: no accounts, no database, no payments, and no stored health records. The main public risk surface is the server-side Gemini proxy and client-side caregiver PDF generation.

## Hardened in this security sprint

- Upgraded `jspdf` from `^3.0.0` to `^4.2.1` to clear dependency advisories.
- Added lightweight in-memory rate limiting to `/api/gemini`:
  - keyed by best available client IP
  - default: 20 requests per 10 minutes
  - intended as a low-cost public-app guardrail
- Added optional chat access gate:
  - set `CHAT_ACCESS_PASSWORD` or `FFC_CHAT_ACCESS_PASSWORD`
  - clients must send `x-chat-access-password`
  - client prompts for password on 401 and remembers it in sessionStorage for the browser session
  - server-side comparison is constant-time (`timingSafeEqual`)
- Redacted Gemini proxy production logs:
  - no request history/context logging
  - no full upstream payload logging in production
  - development still logs detail for debugging

## Production notes

The rate limiter now supports Upstash Redis for durable sliding-window limiting across serverless instances (set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` via Vercel Marketplace → Upstash integration). Falls back automatically to best-effort in-memory limiting when the env vars are absent (local dev, unprovisioned deployments).

## Secrets rule

Never commit real `.env` files or API keys. `GEMINI_API_KEY` must stay server-side only.

## Local privacy model

Health context is client-side/local app state. This keeps infrastructure simple and avoids creating a patient database, but users should still avoid entering emergency/diagnostic information and should rely on their oncology team for medical decisions.

## Verification

```bash
npm audit --json
npm run build
npm run lint
```
