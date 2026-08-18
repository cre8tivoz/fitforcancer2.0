import { afterEach, describe, expect, it, vi } from 'vitest';
import handler from '../api/gemini';
import { getGeminiStreamingResponsePayload } from '../services/geminiService';

const encodeSse = (payloads: unknown[]) =>
  payloads.map((payload) => `data: ${JSON.stringify(payload)}\n\n`).join('');

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

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  window.sessionStorage.clear();
  delete process.env.GEMINI_API_KEY;
  delete process.env.CHAT_ACCESS_PASSWORD;
  delete process.env.FFC_CHAT_ACCESS_PASSWORD;
});

describe('ATHENA streaming client', () => {
  it('delivers accumulated text as SSE deltas arrive', async () => {
    const serverEvents = [
      'event: delta\ndata: {"text":"Hello"}\n\n',
      'event: delta\ndata: {"text":" there"}\n\n',
      'event: done\ndata: {"recommendations":[]}\n\n',
    ];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(responseStream(serverEvents)));

    const partials: string[] = [];
    const result = await getGeminiStreamingResponsePayload(
      [{ role: 'user', content: 'Hi' }],
      { fatigueScore: 2, fatigueZone: '🟢 Green', isMyelomaPatient: false },
      (text) => partials.push(text),
    );

    expect(partials).toEqual(['Hello', 'Hello there']);
    expect(result).toEqual({ text: 'Hello there', recommendations: [] });
  });
});

describe('/api/gemini SSE transport', () => {
  it('streams normal Gemini text chunks instead of waiting for a completed JSON response', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    const geminiPayload = encodeSse([
      { candidates: [{ content: { parts: [{ text: 'First ' }] } }] },
      { candidates: [{ content: { parts: [{ text: 'second.' }] } }] },
    ]);
    const fetchMock = vi.fn().mockResolvedValue(responseStream([geminiPayload]));
    vi.stubGlobal('fetch', fetchMock);

    const { out, res } = makeStreamRes();
    await handler(
      {
        method: 'POST',
        headers: {
          accept: 'text/event-stream',
          'x-forwarded-for': '10.0.1.1',
        },
        body: {
          history: [{ role: 'user', content: 'Tell me something' }],
          context: { fatigueScore: 2, fatigueZone: '🟢 Green', isMyelomaPatient: false },
        },
      } as any,
      res as any,
    );

    expect(fetchMock.mock.calls[0][0]).toContain(':streamGenerateContent?alt=sse');
    expect(out.headers['content-type']).toContain('text/event-stream');
    expect(out.chunks.join('')).toContain('event: delta\ndata: {"text":"First "}');
    expect(out.chunks.join('')).toContain('event: delta\ndata: {"text":"second."}');
    expect(out.chunks.join('')).toContain('event: done');
    expect(out.ended).toBe(true);
  });

  it('executes a streamed catalogue tool call and streams the synthesis with recommendation refs', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    const first = encodeSse([
      {
        candidates: [
          {
            content: {
              role: 'model',
              parts: [
                {
                  functionCall: {
                    id: 'movement-call-1',
                    name: 'recommend_movement',
                    args: { preference: 'any' },
                  },
                },
              ],
            },
          },
        ],
      },
    ]);
    const second = encodeSse([
      { candidates: [{ content: { parts: [{ text: 'Try one of these Green options.' }] } }] },
    ]);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(responseStream([first]))
      .mockResolvedValueOnce(responseStream([second]));
    vi.stubGlobal('fetch', fetchMock);

    const { out, res } = makeStreamRes();
    await handler(
      {
        method: 'POST',
        headers: {
          accept: 'text/event-stream',
          'x-forwarded-for': '10.0.1.2',
        },
        body: {
          history: [{ role: 'user', content: 'Recommend an exercise' }],
          context: { fatigueScore: 1, fatigueZone: '🟢 Green', isMyelomaPatient: false },
        },
      } as any,
      res as any,
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const synthesisBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(synthesisBody.toolConfig.functionCallingConfig.mode).toBe('NONE');
    const responsePart = synthesisBody.contents.at(-1).parts[0].functionResponse;
    expect(responsePart.id).toBe('movement-call-1');
    expect(responsePart.response.items.map((item: any) => item.id)).toEqual(['1', '2', '3']);

    const output = out.chunks.join('');
    expect(output).toContain('Try one of these Green options.');
    expect(output).toContain('"kind":"movement","id":"1"');
    expect(output).toContain('"kind":"movement","id":"2"');
    expect(output).toContain('"kind":"movement","id":"3"');
  });
});
