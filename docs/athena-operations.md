# Athena operations console

The authenticated `/baseline` page combines metadata overview, seven fixed synthetic checks and existing draft/publish/rollback tuning. Existing Neon identity, verified email allowlist and same-origin write checks apply. No additional service token, agent backdoor or Vercel credential is introduced.

## Coverage and data

SDK generation attempts record safe, allowlisted model/finish/error/token/duration metadata in Neon. No message text, health context, IP addresses or account identifiers enter this table. Counts start at rollout and are best-effort: legacy transport, validation/rate-limit rejections and failed telemetry writes are excluded. Duration is generation-handler time, not browser end-to-end latency. Production and admin synthetic traffic are separate. The table is indexed by timestamp and rows older than 28 days are pruned on the next successful recorded attempt; there is no scheduled deletion job while the service is idle.

The authenticated overview shows refresh time, current model, published version, 7/28-day attempt counts, 28-day errors and median generation duration. The initial schema is created automatically using the existing DATABASE_URL connection. Database failure leaves chat and tuning usable; metrics show unavailable. There is no historical backfill from Vercel or Google.

## Synthetic review

The suite runs seven requests sequentially from the browser, each against the draft settings captured when started. Each request retains the existing bounded Gemini execution deadline. Closing/reloading stops further scenarios. Tests use only server-owned synthetic prompts. Failure records are visible and the suite proceeds. The actual recipe selector applies restrictions just as production does. Provider usage is paid, and the run button explicitly says so.

Results include response text, cards, model, duration and timestamp. Narrow checks flag empty/overlong answers, peanut cards, movement cards during urgent fever, and drink cards for a meal. Everything else is labelled human review, never clinical approval. Current and preceding results stay in component memory, not local storage or the database. This first release compares the preceding session run; it does not claim comparison against a durable approved benchmark. Version is the published history row ID at start, not an approval of the tested draft.

## Billing boundary

Google project billing remains external. No documented automatic billing source has been connected to the application. The UI labels billing as not connected and does not turn optional token metadata into settled charges. Production/synthetic separation applies from rollout, not to historical test bills.

## Validation

358 automated tests, including restriction parity, protected auth boundaries, metadata allowlisting/failure tolerance, suite failure visibility and prior-run comparison. Type checking and build are required before release. No production tuning or deployment is changed by opening this PR.
