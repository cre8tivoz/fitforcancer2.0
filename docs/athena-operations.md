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

361 automated tests, including restriction parity, protected auth boundaries, metadata allowlisting/failure tolerance, suite failure visibility and prior-run comparison. Type checking and build are required before release. No production tuning or deployment is changed by opening this PR.

Review follow-up: unsuccessful empty/blocked generations receive an explicit error category; leaving the panel stops scheduling remaining scenarios (an already running provider request may complete). Regression tests cover empty STOP responses in JSON/streaming and suite unmount.


## Outstanding scope — operations console

Status as at 4 November 2026: the first release above is live, but billing, integrated log review, durable test history and independent agent access are not delivered. This section is the scope for the remaining work, not a statement that any of it already works.

### 1. Verify the existing release

- Complete a fresh production email-code sign-in through to the protected dashboard and verify sign-out and a subsequent sign-in. Do not treat an existing session as proof of a fresh login.
- Run one clearly identified synthetic production chat, then verify that production and admin-test generation attempts appear in the correct rows after refresh. Check an intentionally simulated error in a safe test environment, and compare available metadata with the underlying source. Explain that an attempt is not a user or a conversation and that tool calls may generate multiple attempts.
- Verify the seven-check suite, visible failures, individual preview, and same-session comparison. Check draft save, publish and rollback in an isolated environment; do not change production tuning merely to test it. Confirm the limitations and last refresh time are clear on mobile.
- Record evidence, environment, date and remaining gaps. Investigate discrepancies instead of treating a blank or stale counter as zero. The existing telemetry is best-effort and excludes legacy transport, rejected requests and failed writes.

### 2. Spend and billing

**Goal:** See what Fit For Cancer costs to run and understand the cost of future testing, without implying an estimate is a settled charge.

- Verify the actual Google project, billing account, currency, permissions and a supported source for project-level costs. Determine whether a Google Cloud Billing export and aggregation are available, their delay and any setup or ongoing cost. The existing API key and signed-in browser do not establish application access to billing.
- Show 7-day, 28-day and current-month spend where the source supports them, with currency, date range and timezone, source, last successful update and any billing delay. Distinguish settled or provider-reported amounts from estimates and indicate unavailable, partial or stale data explicitly.
- Break down model and project spend only where the billing data supports it. Show budget or cap and remaining headroom only if obtained from a verified source; do not call a spending cap prepaid credit or promise that it is a hard stop.
- For future synthetic tests, use a reliable supported attribution mechanism if one exists. Otherwise show a separately labelled estimate using recorded test token usage and applicable prices, with known omissions and price date. Do not represent a calculated estimate as an invoice or assume historical testing can be isolated.
- Keep Google billing links available as a practical fallback. Handle unavailable data without breaking the rest of the console. Document any required credentials, configuration, access grants and costs before enabling a connection.
- Acceptance: reconcile a chosen period against the source within its stated reporting delay; exercise missing, stale and delayed data; verify currency and attribution labels; never display missing data as $0.

### 3. Log and incident review

**Goal:** Make it practical to investigate reliability and quality while preserving the current privacy boundary.

- First inventory what Google AI Studio, Google Cloud and Vercel actually expose for this project, including fields, access methods, retention, costs, and whether prompt or response content is present. Verify current settings rather than assuming that logs are metadata-only or contain full conversations.
- Design an authenticated incident view for available metadata: time, model, source (production or synthetic when reliably known), outcome, duration and a safe error category, with date/source/outcome filters and clear links to the authoritative provider where possible. Show gaps, data age and access failures explicitly. Avoid personal data in URLs and ordinary application logs.
- Start with allowlisted metadata and synthetic responses. Do not import, copy or display real patient transcripts as an incidental part of this work. If reviewing real conversation content is required, separately specify and obtain a decision on lawful access, user-facing disclosure, consent where applicable, provider terms, sensitive-data handling, retention, deletion and access auditing before implementing it.
- Use least-privilege, server-side access for any provider integration; no keys in the browser or repository. Record admin access and actions without recording patient text. Do not expand production logging or provider retention without a separate decision.
- Acceptance: investigate a known synthetic failure from the console to the source; verify unauthorised requests are rejected; confirm no health context or message text leaks into metadata, URLs or diagnostics; demonstrate stale and unavailable-source behaviour.

### 4. Durable synthetic testing and review

- Save runs across sessions in the existing protected storage, with scenario and suite versions, timestamp, model, published version, exact tested draft settings or an immutable reference, duration, response, recommendation IDs, automated findings and run status. Only server-owned synthetic scenarios may be stored in this first version; never silently save real user conversations.
- Add run history and a clear comparison with an explicitly selected, human-approved baseline. Keep the previous-run comparison if useful, but do not present the current published settings version as approval of the draft that was tested.
- Show differences in response, cards, latency and flags. An unflagged result is “human review”, not a clinical pass. Preserve individual failures and incomplete/cancelled runs; make paid API use and estimated run cost clear before starting.
- Define a bounded retention and deletion mechanism for saved synthetic runs, access controls and audit trail. Handle failed writes without losing visible results or claiming they were saved. Offer export only within the same access and privacy boundaries.
- Acceptance: run the suite, reload and retrieve the same run, approve/select a baseline through an explicit action, compare a later run and delete a test record. Test partial failure, permissions and cancellation.

### 5. Admin and agent access

- Retain the existing verified-email admin sign-in and same-origin protection. Document what a signed-in human or agent can currently view and do; browser access is session-based, not unattended access.
- Define separate read, test and tuning/publish permissions before considering any additional agent integration. If unattended access is needed, design a revocable, scoped, expiring credential and audited operations; never expose a shared backdoor or give billing/admin access merely to run tests.
- Synthetic testing may incur provider charges. Publishing or restoring tuning is an explicit, auditable action; no autonomous production changes are included in this scope.
- Acceptance: verify access restrictions, expiry/revocation, audit records and failure behaviour for the chosen design. If no independent access is implemented, state that clearly in the UI and documentation.

### Delivery order and dependencies

1. Verify sign-in, production metrics and the existing synthetic workflow.
2. Investigate provider billing and logging sources, access, data fields and costs. Record the findings before committing to an integration; use external links or clearly labelled estimates where reliable direct data is unavailable.
3. Add durable synthetic review and a usable mobile-friendly console with clear sections: Overview, Spend, Tests, Logs and Tuning. Preserve current tuning functionality.
4. Implement the verified billing and metadata-log integrations, then consider independent agent access only against an agreed permission design.

All new features require automated coverage for access control, error handling and privacy boundaries, plus a signed-in production verification after deployment. No implementation, permission change, data retention change or deployment is authorised merely by this scope document.
