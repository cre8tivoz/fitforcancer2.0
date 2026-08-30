import { describe, expect, it } from 'vitest';
import { parseMessageWithChips } from '../utils/parseMessageWithChips';

describe('parseMessageWithChips', () => {
  it('accepts an exact canonical resource URL', () => {
    const parsed = parseMessageWithChips(
      'Useful information.\n\n### Verified Resources\n- [COSA](https://www.cosa.org.au/groups/exercise-cancer-care/position-statement/)',
    );

    expect(parsed.links).toEqual([
      {
        title: 'COSA',
        url: 'https://www.cosa.org.au/groups/exercise-cancer-care/position-statement/',
      },
    ]);
  });

  it('rejects deceptive and arbitrary HTTPS links from the verified section', () => {
    const parsed = parseMessageWithChips(
      '### Verified Resources\n- [Lookalike](https://www.cosa.org.au.evil.example/path)\n- [Credentials](https://www.cosa.org.au@evil.example/path)\n- [Random](https://example.com)',
    );

    expect(parsed.links).toEqual([]);
  });

  it('accepts canonical treatment-information links', () => {
    const parsed = parseMessageWithChips(
      '### Verified Resources\n- [Myeloma treatment](https://myeloma.org.au/your-guide/understanding-your-treatment/)',
    );

    expect(parsed.links).toHaveLength(1);
  });
});
