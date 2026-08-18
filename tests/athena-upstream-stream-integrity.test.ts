import { afterEach, describe, expect, it, vi } from 'vitest';
import handler from '../api/gemini';

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

const makeStreamRes = () => {
  const out: {
    status?: number;
    body?: unknown;
    headers: Record<string, string>;
    chunks: string[];
    ended: boolean;
  } = { headers: {}, chunks: [], ended: false };

  return {
    out,
    res: {
      status: (code: number) => ({
        json: (body: unknown) => {
          out.status = code;
          out.body = body;
        },
      }),
      setHeader: (name: string, value: string) => {
        out.headers[name.toLowerCase()] = value;
      },
      write: (chunk: string) => {
        out.chunks.push(chunk);
      },
      end: () => {
        out.ended = true;
      },
      flushHeaders: vi.fn(),
    },
  };
};

const runStreamingRequest = async (upstreamEvents: string[]) => {
  process.env.GEMINI_API_KEY = 'test-key';
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(responseStream(upstreamEvents)));

  const { out, res } = makeStreamRes();
  await handler(
    {
      method: 'POST',
      headers: {
        accept: 'text/event-stream',
        'x-forwarded-for': '10.0.1.99',
      },
      body: {
        history: [{ role: 'user', content: 'Tell me something' }],
        context: { fatigueScore: 2, fatigueZone: '🟢 Green', isMyelomaPatient: false },
      },
    } as any,
    res as any,
  );

  return out;
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete process.env.GEMINI_API_KEY;
  delete process.env.CHAT_ACCESS_PASSWORD;
  delete process.env.FFC_CHAT_ACCESS_PASSWORD;
});

describe('/api/gemini upstream SSE integrity', () => {
  it('rejects malformed Gemini JSON even when a later candidate reports STOP', async () => {
    const out = await runStreamingRequest([
      'data: {"candidates":[{"content":{"parts":[{"text":"First part. "}]}}]}\n\n',
      'data: {"candidates":[\n\n',
      'data: {"candidates":[{"content":{"parts":[{"text":"Second part."}]},"finishReason":"STOP"}]}\n\n',
    ]);

    const output = out.chunks.join('');
    expect(output).toContain('event: delta');
    expect(output).toContain('event: error');
    expect(output).not.toContain('event: done');
    expect(out.ended).toBe(true);
  });

  it.each([
    ['empty object', '{}'],
    ['JSON string', '"corrupt"'],
    ['candidate with no consumable content or terminal state', '{"candidates":[{}]}'],
    ['candidate with only an empty text part', '{"candidates":[{"content":{"parts":[{"text":""}]}}]}'],
  ])('rejects semantically invalid Gemini payload: %s', async (_label, invalidPayload) => {
    const out = await runStreamingRequest([
      'data: {"candidates":[{"content":{"parts":[{"text":"First part. "}]}}]}\n\n',
      `data: ${invalidPayload}\n\n`,
      'data: {"candidates":[{"content":{"parts":[{"text":"Second part."}]},"finishReason":"STOP"}]}\n\n',
    ]);

    const output = out.chunks.join('');
    expect(output).toContain('event: delta');
    expect(output).toContain('event: error');
    expect(output).not.toContain('event: done');
    expect(out.ended).toBe(true);
  });
});
