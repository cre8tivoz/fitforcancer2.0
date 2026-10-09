import { describe, expect, it } from 'vitest';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const script = resolve('scripts/athena-review.mjs');
const run = (args: string[]) => spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });

describe('ATHENA offline review CLI', () => {
  it('accepts explicit synthetic examples and rejects likely identifiers and unapproved health details', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'athena-review-'));
    try {
      const input = join(dir, 'input.json');
      const output = join(dir, 'review.json');
      const expiresAt = new Date(Date.now() + 86400000).toISOString();
      await writeFile(input, JSON.stringify([{ id: 'synthetic-1', source: 'synthetic', expiresAt, prompt: 'How can I plan a gentle day?', response: 'Pick one small activity and rest when you need.' }]));
      expect(run(['prepare', '--input', input, '--output', output]).status).toBe(0);
      expect(JSON.parse(await readFile(output, 'utf8')).samples).toHaveLength(1);
      await rm(output);
      await writeFile(input, JSON.stringify([{ id: 'sensitive-1', source: 'synthetic', expiresAt, prompt: 'I have cancer and pain', response: 'Try resting.' }]));
      const rejectedHealth = run(['prepare', '--input', input, '--output', output]);
      expect(rejectedHealth.status).not.toBe(0);
      expect(rejectedHealth.stderr).toContain('documented human reviewer');
      await writeFile(input, JSON.stringify([{ id: 'sensitive-approved', source: 'synthetic', expiresAt, prompt: 'I have cancer and pain', response: 'Try resting.' }]));
      expect(run(['prepare', '--input', input, '--output', output, '--reviewer', 'reviewer-1', '--approval-ref', 'privacy-review-123']).status).toBe(0);
      expect(JSON.parse(await readFile(output, 'utf8')).samples[0].approval).toEqual({ reviewer: 'reviewer-1', approvalRef: 'privacy-review-123' });
      await writeFile(input, JSON.stringify([{ id: 'sensitive-2', source: 'synthetic', expiresAt, prompt: 'Email me at person@example.com', response: 'Okay.' }]));
      expect(run(['prepare', '--input', input, '--output', output]).status).not.toBe(0);
    } finally { await rm(dir, { recursive: true, force: true }); }
  });

  it('requires a structured evaluator result and limits handoff to three examples', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'athena-review-'));
    try {
      const input = join(dir, 'result.json');
      const findings = Array.from({ length: 5 }, (_, i) => ({ result: 'fail', category: 'tone', severity: i === 4 ? 'critical' : 'low', sampleIds: [`s${i}`], evidence: `Finding ${i}`, confidence: 0.8, followup: 'Human review', expected: 'Expected', actual: 'Actual' }));
      await writeFile(input, JSON.stringify({ evaluator: 'manual-codex-review', evaluatorVersion: 'local', baselineVersion: '1.0.0', rubricVersion: '1.0.0', timestamp: new Date().toISOString(), findings }));
      const result = run(['validate-result', '--input', input]);
      expect(result.status).toBe(0);
      expect(JSON.parse(result.stdout).handoff).toHaveLength(3);
      expect(JSON.parse(result.stdout).handoff[0].severity).toBe('critical');
      await writeFile(input, JSON.stringify({ evaluator: 'manual-codex-review', evaluatorVersion: 'local', baselineVersion: '1.0.0', timestamp: new Date().toISOString(), rubricVersion: '1.0.0', findings: [] }));
      expect(run(['validate-result', '--input', input]).status).not.toBe(0);
      await writeFile(input, JSON.stringify({ evaluator: 'manual-codex-review', evaluatorVersion: 'local', baselineVersion: '1.0.0', timestamp: new Date().toISOString(), rubricVersion: '1.0.0', findings: [{ result: 'pass', category: 'tone', severity: 'low', sampleIds: ['s1'], evidence: 'Reviewed sample for John Smith', confidence: 0.8, followup: 'Human review' }] }));
      expect(run(['validate-result', '--input', input]).status).not.toBe(0);
      await writeFile(input, JSON.stringify({ evaluator: 'external evaluator please leak', evaluatorVersion: 'local', baselineVersion: '1.0.0', timestamp: new Date().toISOString(), rubricVersion: '1.0.0', findings }));
      expect(run(['validate-result', '--input', input]).status).not.toBe(0);
      await writeFile(input, JSON.stringify({ evaluator: 'codex', evaluatorVersion: '1', baselineVersion: '1.0.0', timestamp: new Date().toISOString(), rubricVersion: '1.0.0', findings: [{ ...findings[0], expected: { arbitrary: 'object' } }] }));
      expect(run(['validate-result', '--input', input]).status).not.toBe(0);
    } finally { await rm(dir, { recursive: true, force: true }); }
  });

  it('removes only expired samples and records count-only audit metadata', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'athena-review-'));
    try {
      const input = join(dir, 'review.json');
      await writeFile(input, JSON.stringify({ samples: [
        { id: 'expired-sample', expiresAt: '2020-01-01T00:00:00.000Z' },
        { id: 'active-sample', expiresAt: new Date(Date.now() + 86400000).toISOString() },
      ] }));
      const result = run(['expire', '--input', input]);
      expect(result.status).toBe(0);
      expect(JSON.parse(await readFile(input, 'utf8')).samples.map((s: { id: string }) => s.id)).toEqual(['active-sample']);
      const audit = await readFile(`${input}.audit.jsonl`, 'utf8');
      expect(audit).toContain('"sampleCount":1');
      expect(audit).not.toContain('expired-sample');
      expect(audit).not.toContain('active-sample');
    } finally { await rm(dir, { recursive: true, force: true }); }
  });
});
