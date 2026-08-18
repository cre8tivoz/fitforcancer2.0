import { afterEach, describe, expect, it, vi } from 'vitest';
import { getGeminiStreamingResponsePayload } from '../services/geminiService';

const responseStream = (chunks: string[]) => {
  const encoder = new TextEncoder();
  let index = 0;

  return new Response(
    new ReadableStream({
      pull(controller) {
        if (index >= chunks.length) {
          controller.close();
          return;
        }
        controller.enqueue(encoder.encode(chunks[index]));
        index += 1;
      },
    }),
    {
      status: 200,
      headers: { 'content-type': 'text/event-stream; charset=utf-8' },
    },
  );
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('ATHENA malformed SSE handling', () => {
  it('rejects the whole stream when a malformed reset is followed by valid synthesis and done events', async () => {
    const serverEvents = [
      'event: delta\ndata: {"text":"Provisional"}\n\n',
      'event: reset\ndata: {\n\n',
      'event: delta\ndata: {"text":"Final recommendation"}\n\n',
      'event: done\ndata: {"recommendations":[{"kind":"movement","id":"1"}]}\n\n',
    ];

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(responseStream(serverEvents)));

    const partials: string[] = [];
    await expect(
      getGeminiStreamingResponsePayload(
        [{ role: 'user', content: 'Recommend a movement' }],
        { fatigueScore: 2, fatigueZone: '🟢 Green', isMyelomaPatient: false },
        (text) => partials.push(text),
      ),
    ).rejects.toThrow(/malformed data/i);

    expect(partials).toEqual(['Provisional', 'ProvisionalFinal recommendation']);
  });

  it.each([
    ['delta without text', 'event: delta\ndata: {}\n\n'],
    ['reset with a non-object payload', 'event: reset\ndata: null\n\n'],
    ['error without a message', 'event: error\ndata: {}\n\n'],
    ['done without recommendation refs', 'event: done\ndata: {}\n\n'],
    [
      'done with an invalid recommendation ref',
      'event: done\ndata: {"recommendations":[{"kind":"movement","id":""}]}\n\n',
    ],
  ])('poisons the stream for protocol-invalid %s', async (_label, invalidEvent) => {
    const serverEvents = [
      invalidEvent,
      'event: delta\ndata: {"text":"Later valid text"}\n\n',
      'event: done\ndata: {"recommendations":[]}\n\n',
    ];

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(responseStream(serverEvents)));

    await expect(
      getGeminiStreamingResponsePayload(
        [{ role: 'user', content: 'Hi' }],
        { fatigueScore: 2, fatigueZone: '🟢 Green', isMyelomaPatient: false },
        () => undefined,
      ),
    ).rejects.toThrow(/malformed data/i);
  });

  it('rejects any non-empty event after terminal done', async () => {
    const serverEvents = [
      'event: delta\ndata: {"text":"Complete answer"}\n\n',
      'event: done\ndata: {"recommendations":[]}\n\n',
      'event: delta\ndata: {"text":"Unexpected trailing text"}\n\n',
    ];

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(responseStream(serverEvents)));

    const partials: string[] = [];
    await expect(
      getGeminiStreamingResponsePayload(
        [{ role: 'user', content: 'Hi' }],
        { fatigueScore: 2, fatigueZone: '🟢 Green', isMyelomaPatient: false },
        (text) => partials.push(text),
      ),
    ).rejects.toThrow(/malformed data/i);

    expect(partials).toEqual(['Complete answer']);
  });
});
