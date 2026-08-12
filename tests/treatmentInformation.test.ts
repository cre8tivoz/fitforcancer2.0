import { describe, expect, it } from 'vitest';
import { buildTreatmentInformationText, detectBloodCancerFamily } from '../utils/treatmentInformation';

describe('ATHENA treatment information routing', () => {
  it('does not mistake the ordinary word all for ALL leukaemia', () => {
    expect(
      detectBloodCancerFamily([
        { role: 'user', content: 'Can you explain all the options at a high level?' },
      ]),
    ).toBeNull();
  });

  it('recognises uppercase ALL as a leukaemia subtype', () => {
    expect(
      detectBloodCancerFamily([
        { role: 'user', content: 'I was diagnosed with ALL. What does treatment generally involve?' },
      ]),
    ).toBe('leukaemia');
  });

  it('uses the most recent explicit family in conversation history', () => {
    expect(
      detectBloodCancerFamily([
        { role: 'user', content: 'I have myeloma.' },
        { role: 'model', content: 'Okay.' },
        { role: 'user', content: 'My partner has lymphoma and I am asking about their treatment now.' },
      ]),
    ).toBe('lymphoma_cll');
  });

  it('uses the later family when one message corrects an earlier family', () => {
    expect(
      detectBloodCancerFamily([
        { role: 'user', content: "I don't have myeloma, I have lymphoma." },
      ]),
    ).toBe('lymphoma_cll');
  });

  it('falls back to broad blood-cancer context when no family is named', () => {
    const block = buildTreatmentInformationText(
      'blood_myeloma',
      [{ role: 'user', content: 'What treatment types might I hear about?' }],
      false,
    );

    expect(block).toContain('TREATMENT INFORMATION — BLOOD CANCER');
    expect(block).toContain('ask one short clarifying question');
    expect(block).not.toContain('TREATMENT INFORMATION — MYELOMA');
  });
});
