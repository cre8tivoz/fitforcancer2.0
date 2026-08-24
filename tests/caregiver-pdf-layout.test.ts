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

const pageCommands = (doc: ReturnType<typeof buildCaregiverPdf>): string[] => {
  const pages = (doc.internal as unknown as { pages: string[][] }).pages;
  return pages.slice(1).map((page) => (page ?? []).join('\n'));
};

describe('caregiver PDF layout', () => {
  it('normalises unsupported Unicode while preserving meaningful symbols as readable ASCII', () => {
    expect(sanitisePdfText('🟡 Yellow — Treatment / moderate fatigue')).toBe(
      'Yellow - Treatment / moderate fatigue',
    );
    expect(sanitisePdfText('patient‑reported “okay” ❤️')).toBe('patient-reported "okay"');
    expect(sanitisePdfText('37.5 °C, €20, £15, 5 µg')).toBe(
      '37.5 deg C, EUR 20, GBP 15, 5 microg',
    );
  });

  it('keeps a representative caregiver summary on one readable page', () => {
    const doc = buildCaregiverPdf(4, history, new Date('2026-08-24T19:56:00+10:00'));

    expect(doc.getNumberOfPages()).toBe(1);

    const commands = pageCommands(doc)[0];
    expect(commands).toContain('FIT FOR CANCER');
    expect(commands).toContain('Caregiver Summary');
    expect(commands).toContain('Yellow - Treatment / moderate fatigue');
    expect(commands).toContain('Recent Check-ins');
    expect(commands).toContain('Key Recommendations');
    expect(commands).toContain('Moderate activity');
    expect(commands).toContain('High-protein focus');
    expect(commands).toContain('Clinical Disclaimer');
    expect(commands).not.toContain('❤️');
    expect(commands).not.toContain('🟡');
    expect(commands).not.toContain('‑');
  });

  it('splits an oversized check-in note across pages and repeats table context on every note page', () => {
    const longHistory: EnergyHistoryEntry[] = [
      {
        id: 99,
        date: '2026-08-24T09:00:00.000Z',
        score: 5,
        note: Array.from({ length: 2200 }, (_, index) => `detail${index}`).join(' '),
      },
    ];

    const doc = buildCaregiverPdf(5, longHistory, new Date('2026-08-24T19:56:00+10:00'));
    const pages = pageCommands(doc);
    const notePages = pages.filter((page) => page.includes('detail'));

    expect(doc.getNumberOfPages()).toBeGreaterThan(1);
    expect(notePages.length).toBeGreaterThan(1);
    notePages.forEach((page) => {
      expect(page).toContain('Recent Check-ins');
      expect(page).toContain('Date');
      expect(page).toContain('Score');
      expect(page).toContain('Zone');
      expect(page).toContain('Note');
    });
    expect(pages.some((page) => page.includes('Recent Check-ins (continued)'))).toBe(true);
  });
});
