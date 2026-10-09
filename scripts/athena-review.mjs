#!/usr/bin/env node
import { readFile, writeFile, mkdir, rm, rename, chmod } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const BASELINE_PATH = resolve(ROOT, 'tests/fixtures/athena-baseline.v1.json');
const usage = `ATHENA offline review (local files only; no network calls)\n\nCommands:\n  prepare --input <json> --output <json> [--reviewer <name> --approval-ref <ref>]\n  validate-result --input <json> [--max-examples <1..3>]\n  expire --input <json>\n  delete --input <json>\n\nOnly manually authored synthetic samples are accepted. Review artifacts expire within 30 days.`;
function args(argv) {
  const [command, ...rest] = argv;
  const result = { command };
  for (let i = 0; i < rest.length; i += 1) {
    const key = rest[i];
    if (!key.startsWith('--')) throw new Error(`Unexpected argument: ${key}`);
    if (key === '--help') { result.help = true; continue; }
    result[key.slice(2)] = rest[++i];
  }
  return result;
}
const IDENTIFIERS = [
  ['email', /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i],
  ['phone', /(?:\+?61\s?|0)[2-478](?:[\s()-]*\d){8}\b/],
  ['date', /\b(?:\d{1,2}[/-]\d{1,2}[/-](?:\d{2}|\d{4})|\d{4}-\d{2}-\d{2})\b/],
  ['postcode', /\b(?:NSW|VIC|QLD|SA|WA|TAS|NT|ACT)?\s?\d{4}\b/i],
  ['url', /https?:\/\/\S+/i],
  ['secret', /\b(?:api[_ -]?key|access[_ -]?token|password)\s*[:=]\s*\S+/i],
  ['likely name', /\b(?:my name is|i am|i'm|patient)\s+[A-Z][a-z]{1,30}\b|\b(?!Human\b|Reviewed\b|Expected\b|Actual\b|Baseline\b|Review\b)[A-Z][a-z]{1,30}\s+[A-Z][a-z]{1,30}\b/],
  ['record identifier', /\b(?:mrn|medical record|account|insurance)\s*(?:number|no\.?|#|id)?\s*[:#-]?\s*[A-Z0-9-]{5,}\b/i],
];
const HEALTH = [
  ['diagnosis or cancer', /\b(?:cancer|tumou?r|carcinoma|leuka?emia|lymphoma|diagnos(?:is|ed))\b/i],
  ['treatment or medication', /\b(?:chemotherapy|radiotherapy|immunotherapy|treatment|medication|medicine|drug|dose)\b/i],
  ['symptom or clinical detail', /\b(?:pain|nausea|vomit(?:ing)?|fever|bleed(?:ing)?|breathless|shortness of breath|symptom|blood count|neutropenia)\b/i],
];
function inspect(text) {
  return { identifiers: IDENTIFIERS.filter(([, re]) => re.test(text)).map(([name]) => name), health: HEALTH.filter(([, re]) => re.test(text)).map(([name]) => name) };
}
function validateSample(s) {
  if (!s || typeof s.id !== 'string' || !/^[a-z0-9][a-z0-9._-]{0,63}$/i.test(s.id)) throw new Error('Sample requires a short non-identifying id');
  if (s.source !== 'synthetic') throw new Error(`${s.id}: only manually authored synthetic samples are accepted by this local tool`);
  if (typeof s.prompt !== 'string' || typeof s.response !== 'string' || !s.prompt.trim() || !s.response.trim()) throw new Error(`${s.id}: prompt and response are required`);
  const exp = Date.parse(s.expiresAt);
  if (!Number.isFinite(exp) || exp <= Date.now() || exp > Date.now() + 30 * 86400000) throw new Error(`${s.id}: expiresAt must be within 30 days`);
  const report = inspect(`${s.prompt}\n${s.response}`);
  if (report.identifiers.length) throw new Error(`${s.id}: likely identifiers found (${report.identifiers.join(', ')}); redact or reject manually`);
  if (report.health.length && (!s.approval?.reviewer?.trim() || !s.approval?.approvalRef?.trim())) throw new Error(`${s.id}: sensitive health detail requires documented human reviewer and approvalRef`);
  return { ...s, _inspection: report };
}
async function readJson(path) { return JSON.parse(await readFile(resolve(path), 'utf8')); }
async function audit(path, event, count) {
  const auditPath = `${resolve(path)}.audit.jsonl`;
  await mkdir(dirname(auditPath), { recursive: true });
  await writeFile(auditPath, JSON.stringify({ at: new Date().toISOString(), event, sampleCount: count, actor: process.env.USER || 'local-user' }) + '\n', { flag: 'a', mode: 0o600 });
}
async function prepare(o) {
  if (!o.input || !o.output) throw new Error('--input and --output are required');
  const raw = await readJson(o.input);
  const samples = Array.isArray(raw) ? raw : raw.samples;
  if (!Array.isArray(samples) || !samples.length) throw new Error('Input must be a non-empty array or {"samples":[]}');
  const ids = new Set();
  const approved = samples.map((sample) => {
    const enriched = { ...sample, approval: {
      reviewer: o.reviewer || sample.approval?.reviewer,
      approvalRef: o['approval-ref'] || sample.approval?.approvalRef,
    } };
    const valid = validateSample(enriched);
    if (ids.has(valid.id)) throw new Error(`Duplicate sample id: ${valid.id}`);
    ids.add(valid.id);
    return { id: valid.id, source: valid.source, expiresAt: valid.expiresAt, ...(valid.approval.reviewer && valid.approval.approvalRef ? { approval: valid.approval } : {}), prompt: valid.prompt, response: valid.response };
  });
  const baseline = await readJson(BASELINE_PATH);
  const output = { schemaVersion: 1, baselineVersion: baseline.version, createdAt: new Date().toISOString(), samples: approved };
  const destination = resolve(o.output);
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, JSON.stringify(output, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
  await audit(destination, 'created', approved.length);
  process.stdout.write(`Prepared ${approved.length} approved sample(s) at ${destination}. Keep this local file access-restricted; delete it at expiry.\n`);
}
async function validateResult(o) {
  if (!o.input) throw new Error('--input is required');
  const max = Number(o['max-examples'] || 3);
  if (!Number.isInteger(max) || max < 1 || max > 3) throw new Error('--max-examples must be 1..3');
  const data = await readJson(o.input);
  if (data.baselineVersion !== '1.0.0' || data.rubricVersion !== '1.0.0' || !Array.isArray(data.findings) || data.findings.length === 0) throw new Error('Result must use baseline/rubric 1.0.0 and contain non-empty findings[]');
  const safeLabel = (value) => typeof value === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9._+-]{0,39}$/.test(value);
  if (!safeLabel(data.evaluator) || !safeLabel(data.evaluatorVersion) || !Number.isFinite(Date.parse(data.timestamp))) throw new Error('Result requires short evaluator and version labels plus a valid timestamp');
  const allowedCategories = new Set(['tone', 'clarity', 'empathy', 'safety', 'clinical-boundary', 'recommendation-relevance', 'formatting', 'regression']);
  const allowedSeverity = new Set(['info', 'low', 'medium', 'high', 'critical']);
  for (const finding of data.findings) {
    if (!['pass', 'fail'].includes(finding.result) || !allowedCategories.has(finding.category) || !allowedSeverity.has(finding.severity)) throw new Error('Finding has an invalid result, category, or severity');
    if (typeof finding.evidence !== 'string' || !finding.evidence.trim() || typeof finding.confidence !== 'number' || !Number.isFinite(finding.confidence) || finding.confidence < 0 || finding.confidence > 1 || typeof finding.followup !== 'string' || !finding.followup.trim() || (finding.expected !== undefined && typeof finding.expected !== 'string') || (finding.actual !== undefined && typeof finding.actual !== 'string')) throw new Error('Each finding requires evidence, finite confidence (0..1), string expected/actual when supplied, and followup');
    if (!Array.isArray(finding.sampleIds) || finding.sampleIds.length === 0 || finding.sampleIds.some((id) => typeof id !== 'string' || !/^[a-z0-9][a-z0-9._-]{0,63}$/i.test(id))) throw new Error('Each finding requires valid sampleIds[]');
    for (const field of [finding.evidence, finding.followup, finding.expected || '', finding.actual || '']) {
      if (IDENTIFIERS.some(([, pattern]) => pattern.test(field))) throw new Error('Evaluator text contains a likely identifier; remove it and rerun validation');
    }
  }
  const severityRank = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
  const failures = data.findings.filter((f) => f.result === 'fail');
  const ordered = [...data.findings].sort((a, b) => Number(a.result !== 'fail') - Number(b.result !== 'fail') || severityRank[a.severity] - severityRank[b.severity]);
  const handoff = ordered.slice(0, max).map((f) => ({ result: f.result, category: f.category, severity: f.severity, sampleIds: f.sampleIds, evidence: f.evidence.slice(0, 400), expected: f.expected?.slice(0, 240) || '', actual: f.actual?.slice(0, 240) || '', confidence: f.confidence, followup: f.followup.slice(0, 240) }));
  await audit(o.input, 'result-validated', data.findings.length);
  process.stdout.write(JSON.stringify({ evaluator: data.evaluator, evaluatorVersion: data.evaluatorVersion, rubricVersion: '1.0.0', baselineVersion: data.baselineVersion, timestamp: data.timestamp, result: failures.length ? 'fail' : 'pass', findingCount: data.findings.length, handoff }, null, 2) + '\n');
}
async function expire(o) {
  if (!o.input) throw new Error('--input is required');
  const path = resolve(o.input);
  const data = await readJson(path);
  if (!Array.isArray(data.samples)) throw new Error('Review artifact has no samples[]');
  const now = Date.now();
  const remaining = data.samples.filter((s) => Date.parse(s.expiresAt) > now);
  const expiredCount = data.samples.length - remaining.length;
  if (!expiredCount) { process.stdout.write('No expired samples.\n'); return; }
  await audit(path, 'expired-removed', expiredCount);
  if (!remaining.length) {
    await rm(path);
    process.stdout.write(`Deleted review artifact after removing ${expiredCount} expired sample(s).\n`);
    return;
  }
  const temp = `${path}.${process.pid}.tmp`;
  await writeFile(temp, JSON.stringify({ ...data, samples: remaining }, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
  await chmod(temp, 0o600);
  await rename(temp, path);
  await chmod(path, 0o600);
  process.stdout.write(`Removed ${expiredCount} expired sample(s); ${remaining.length} remain.\n`);
}
async function deleteArtifact(o) {
  if (!o.input) throw new Error('--input is required');
  const path = resolve(o.input);
  const data = await readJson(path);
  if (!Array.isArray(data.samples)) throw new Error('Review artifact has no samples[]');
  await audit(path, 'deleted', data.samples.length);
  await rm(path);
  process.stdout.write('Deleted review artifact; a text-free deletion audit remains beside it.\n');
}
try {
  const o = args(process.argv.slice(2));
  if (o.help) process.stdout.write(usage + '\n');
  else if (o.command === 'prepare') await prepare(o);
  else if (o.command === 'validate-result') await validateResult(o);
  else if (o.command === 'expire') await expire(o);
  else if (o.command === 'delete') await deleteArtifact(o);
  else throw new Error(usage);
} catch (error) {
  process.stderr.write(`ATHENA review: ${error.message}\n`);
  process.exitCode = 1;
}
