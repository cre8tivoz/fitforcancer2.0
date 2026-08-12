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

  it('routes the full phrase chronic lymphocytic leukaemia to lymphoma/CLL', () => {
    expect(
      detectBloodCancerFamily([
        { role: 'user', content: 'I have chronic lymphocytic leukaemia. What treatments are generally used?' },
      ]),
    ).toBe('lymphoma_cll');
  });

  it('does not let the nested word leukaemia steal a full CLL diagnosis', () => {
    const block = buildTreatmentInformationText(
      undefined,
      [{ role: 'user', content: 'I have chronic lymphocytic leukaemia.' }],
      false,
    );

    expect(block).toContain('TREATMENT INFORMATION — LYMPHOMA / CLL');
    expect(block).not.toContain('TREATMENT INFORMATION — LEUKAEMIA\n');
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

  it('uses the final occurrence when a family is mentioned more than once', () => {
    expect(
      detectBloodCancerFamily([
        {
          role: 'user',
          content: 'They initially thought myeloma, then lymphoma, but it is definitely myeloma.',
        },
      ]),
    ).toBe('myeloma');
  });

  it('allows a later correction to override a full CLL name', () => {
    expect(
      detectBloodCancerFamily([
        {
          role: 'user',
          content: 'They initially thought chronic lymphocytic leukaemia, but confirmed myeloma.',
        },
      ]),
    ).toBe('myeloma');
  });

  it('ignores a family that the user says was ruled out', () => {
    expect(
      detectBloodCancerFamily([
        { role: 'user', content: 'They ruled out myeloma; what blood-cancer treatments are there?' },
      ]),
    ).toBeNull();
  });

  it('ignores a diagnosis when the family is followed by ruled out', () => {
    expect(
      detectBloodCancerFamily([
        { role: 'user', content: 'Myeloma was ruled out. They are still working out what blood cancer it is.' },
      ]),
    ).toBeNull();
  });

  it('keeps a positive family when an earlier family in the same message is negated', () => {
    expect(
      detectBloodCancerFamily([
        { role: 'user', content: 'They ruled out myeloma and confirmed lymphoma.' },
      ]),
    ).toBe('lymphoma_cll');
  });

  it('routes a ruled-out family to broad blood information instead of its specific block', () => {
    const block = buildTreatmentInformationText(
      'blood_myeloma',
      [{ role: 'user', content: 'They ruled out myeloma; what blood-cancer treatments are there?' }],
      true,
    );

    expect(block).toContain('TREATMENT INFORMATION — BLOOD CANCER');
    expect(block).not.toContain('TREATMENT INFORMATION — MYELOMA');
  });

  it('routes named AML treatment context even when the cancer selector is blank', () => {
    const block = buildTreatmentInformationText(
      undefined,
      [{ role: 'user', content: 'I have AML. What treatment types are generally used?' }],
      false,
    );

    expect(block).toContain('TREATMENT INFORMATION — LEUKAEMIA');
    expect(block).toContain('Leukaemia Foundation');
  });

  it('routes named CLL treatment context even when the cancer selector is blank', () => {
    const block = buildTreatmentInformationText(
      undefined,
      [{ role: 'user', content: 'I have CLL. What treatments are generally around?' }],
      false,
    );

    expect(block).toContain('TREATMENT INFORMATION — LYMPHOMA / CLL');
    expect(block).toContain('Lymphoma Australia');
  });

  it('routes spelled-out CLL treatment context even when the cancer selector is blank', () => {
    const block = buildTreatmentInformationText(
      undefined,
      [{ role: 'user', content: 'I have chronic lymphocytic leukaemia.' }],
      false,
    );

    expect(block).toContain('TREATMENT INFORMATION — LYMPHOMA / CLL');
    expect(block).not.toContain('TREATMENT INFORMATION — LEUKAEMIA\n');
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

  it('does not treat the legacy myeloma boolean as proof of myeloma', () => {
    const block = buildTreatmentInformationText(
      'blood_myeloma',
      [{ role: 'user', content: 'I have blood cancer. What treatments are around?' }],
      true,
    );

    expect(block).toContain('TREATMENT INFORMATION — BLOOD CANCER');
    expect(block).not.toContain('TREATMENT INFORMATION — MYELOMA');
  });
});