import { describe, expect, it } from 'vitest';
import { buildCaregiverPdf, sanitisePdfText } from '../utils/caregiverPdf';
import { EnergyHistoryEntry } from '../types';

const history: EnergyHistoryEntry[] = [
  {
    id: 1,
    date: '2026-08-12T10:00:00.000Z',
    score: 2,
    note: 'Feeling okay ❤️ — appetite improving',
  },
  {
    id: 2,
    date: '2026-08-13T10:00:00.000Z',
    score: 4,
    note: 'Treatment-day fatigue – taking it slowly',
  },
];

describe('caregiver PDF layout', () => {
  it('normalises unsupported Unicode before text reaches jsPDF Helvetica', () => {
    expect(sanitisePdfText('🟡 Yellow — Treatment / moderate fatigue')).toBe(
      'Yellow - Treatment / moderate fatigue',
    );
    expect(sanitisePdfText('patient‑reported “okay” ❤️')).toBe('patient-reported "okay"');
  });

  it('keeps a representative caregiver summary on one readable page', () => {
    const doc = buildCaregiverPdf(4, history, new Date('2026-08-24T19:56:00+10:00'));

    expect(doc.getNumberOfPages()).toBe(1);

    const pageCommands = ((doc.internal as unknown as { pages: string[][] }).pages[1] ?? []).join('\n');
    expect(pageCommands).toContain('FIT FOR CANCER');
    expect(pageCommands).toContain('Caregiver Summary');
    expect(pageCommands).toContain('Yellow - Treatment / moderate fatigue');
    expect(pageCommands).toContain('Recent Check-ins');
    expect(pageCommands).toContain('Key Recommendations');
    expect(pageCommands).toContain('Moderate activity');
    expect(pageCommands).toContain('High-protein focus');
    expect(pageCommands).toContain('Clinical Disclaimer');
    expect(pageCommands).not.toContain('❤️');
    expect(pageCommands).not.toContain('🟡');
    expect(pageCommands).not.toContain('‑');
  });
});
