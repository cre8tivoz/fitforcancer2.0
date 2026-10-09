# ATHENA local review workflow

This workflow is opt-in and local. Production requests do not invoke it, and it makes no network calls. It creates no shared review service or automatic transcript capture. The versioned rubric and fixtures in `tests/fixtures/athena-baseline.v1.json` are synthetic and are a proposed review baseline for this workflow (`proposed-pending-human-review`). A maintainer must approve it before release decisions rely on it.

## Prepare an approved sample file

Create an input JSON file with manually authored synthetic examples only. Consent-based and redacted imports are rejected by this first local version pending privacy-policy and retention review. Synthetic examples with sensitive health detail require a documented human reviewer and approval reference in sample metadata. Do not treat a synthetic label as evidence that a source is safe. For example:

```json
[
  {
    "id": "synthetic-greeting-01",
    "source": "synthetic",
    "expiresAt": "2026-10-16T00:00:00.000Z",
    "prompt": "What can you help me with?",
    "response": "I can help with practical planning and explain information from the resources here. Your care team is best placed to advise on your personal treatment."
  }
]
```

Run `pnpm athena:review prepare --input /path/to/samples.json --output /path/to/review.json`. For a manually documented approval applying to all health-detail examples in that input file, add `--reviewer <reviewer-id> --approval-ref <approval-reference>`; otherwise put approval metadata on each sample. Output creation is exclusive and uses restrictive local file permissions. The tool rejects likely identifiers, malformed records and dates more than 30 days in the future. Synthetic health scenarios are allowed only with documented `approval.reviewer` and `approval.approvalRef` metadata; this approval is required because automated detection cannot establish that a sample is synthetic. Automated checks are conservative screening only; they do not establish de-identification. When unsure, reject the sample. Do not place real patient data in source control or send it to an external evaluator.

The generated review file contains prompt/response text and is sensitive. Keep it on an access-restricted device, use a short expiry, and delete it when review is complete. The adjacent `.audit.jsonl` records timestamps, event names, sample counts and local actor only; it must not contain prompt or response text. Audit files can themselves identify the existence of a sample and should be access-restricted and removed under the same local retention policy. `pnpm athena:review expire --input /path/to/review.json` removes individually expired samples and rewrites the restricted artifact; it deletes the artifact when none remain. `pnpm athena:review delete --input /path/to/review.json` deletes it early and records a text-free deletion event. Expiry and deletion audit entries contain no sample IDs or content.

## Controlled advisory evaluation

Supply only approved synthetic examples and the baseline rubric to a human-operated ChatGPT/Codex or another approved evaluator. Do not give the evaluator code-editing, prompt-editing, configuration, deployment or production access. Compare candidate behaviour against the baseline; do not ask for diagnosis, clinical policy, or treatment recommendations. Manually save the evaluator's structured result as JSON, including evaluator name/version, timestamp, baseline and rubric versions, and non-empty findings with `result`, `category`, `severity`, `sampleIds`, `evidence`, `confidence` and `followup`. The evaluator output may include text, so keep it local and synthetic too.

Validate it with `pnpm athena:review validate-result --input /path/to/result.json`. This command checks the structure and prints an advisory pass/fail plus up to three concise examples, prioritising failures by severity and including passing comparisons when space remains. A pass is not release approval. A human reviewer must review material findings and approve any implementation decision. The tool does not alter code, prompts, model settings or deployment state.

Supported categories: `tone`, `clarity`, `empathy`, `safety`, `clinical-boundary`, `recommendation-relevance`, `formatting`, and `regression`. Severity values are `info`, `low`, `medium`, `high`, and `critical`.

This local tool is not a consent system, authenticated multi-user store, guaranteed redactor, or substitute for checking the applicable privacy policy, provider retention, and external evaluator data handling. It is intentionally limited to explicit local inputs and structured advisory outputs.
