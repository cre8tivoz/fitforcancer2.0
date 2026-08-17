import { describe, expect, it } from 'vitest';
import { buildConversationExportText } from '../utils/chatExport';

describe('ATHENA conversation export recommendations', () => {
  it('includes canonical movement and nutrition details owned by the model message', () => {
    const text = buildConversationExportText(
      [
        { role: 'user', content: 'What would you recommend?' },
        {
          role: 'model',
          content: 'These two are worth a look.',
          recommendations: [
            { kind: 'movement', id: '1' },
            { kind: 'recipe', id: '10' },
          ],
        },
      ],
      '17 August 2026, 11:30 pm',
    );

    expect(text).toContain('These two are worth a look.');
    expect(text).toContain('[ATHENA RECOMMENDATION — MOVEMENT]');
    expect(text).toContain('Brisk Walking');
    expect(text).toContain('Duration: 15–30 mins');
    expect(text).toContain('Benefit: Aerobic fitness');
    expect(text).toContain('[ATHENA RECOMMENDATION — NUTRITION]');
    expect(text).toContain('Hydrating Watermelon & Mint Cooler');
    expect(text).toContain('Prep: 3 mins');
    expect(text).toContain('Category: Hydrating');
  });

  it('omits stale recommendation refs rather than inventing export content', () => {
    const text = buildConversationExportText(
      [
        {
          role: 'model',
          content: 'An old recommendation.',
          recommendations: [{ kind: 'movement', id: '9999' }],
        },
      ],
      '17 August 2026, 11:30 pm',
    );

    expect(text).toContain('An old recommendation.');
    expect(text).not.toContain('ATHENA RECOMMENDATION');
  });
});
