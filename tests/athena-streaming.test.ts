import { afterEach, describe, expect, it, vi } from 'vitest';
import handler from '../api/gemini';
import { getGeminiStreamingResponsePayload } from '../services/geminiService';

const encodeSse = (payloads: unknown[], includeTerminalStop = true) =>
  payloads.map((payload, index) => {
    let eventPayload = payload as any;
    if (includeTerminalStop && index === payloads.length - 1) {
      const candidates = eventPayload?.candidates;
      const firstCandidate = Array.isArray(candidates) ? candidates[0] : undefined;
      if (firstCandidate && !firstCandidate.finishReason) {
        eventPayload = {
          ...eventPayload,
          candidates: [
            { ...firstCandidate, finishReason: 'STOP' },
            ...candidates.slice(1),
          ],
        };
      }
    }
    return `data: ${JSON.stringify(eventPayload)}\n\n`;
  }).join('');

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

  it('parses SSE when CRLF pairs are split across network chunks', async () => {
    const chunks = [
      'event: delta\r',
      '\ndata: {"text":"Hello"}\r',
      '\n\r',
      '\nevent: done\r',
      '\ndata: {"recommendations":[]}\r',
      '\n\r',
      '\n',
    ];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(responseStream(chunks)));

    const partials: string[] = [];
    const result = await getGeminiStreamingResponsePayload(
      [{ role: 'user', content: 'Hi' }],
      { fatigueScore: 2, fatigueZone: '🟢 Green', isMyelomaPatient: false },
      (text) => partials.push(text),
    );

    expect(partials).toEqual(['Hello']);
    expect(result.text).toBe('Hello');
  });

  it('rejects a truncated stream that closes without a done event', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(responseStream(['event: delta\ndata: {"text":"Partial answer"}\n\n'])),
    );

    const partials: string[] = [];
    await expect(
      getGeminiStreamingResponsePayload(
        [{ role: 'user', content: 'Hi' }],
        { fatigueScore: 2, fatigueZone: '🟢 Green', isMyelomaPatient: false },
        (text) => partials.push(text),
      ),
    ).rejects.toThrow(/ended before completion/i);

    expect(partials).toEqual(['Partial answer']);
  });

  it('rolls back provisional first-pass text before accepting tool synthesis', async () => {
    const serverEvents = [
      'event: delta\ndata: {"text":"Provisional"}\n\n',
      'event: reset\ndata: {}\n\n',
      'event: delta\ndata: {"text":"Final recommendation"}\n\n',
      'event: done\ndata: {"recommendations":[{"kind":"movement","id":"1"}]}\n\n',
    ];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(responseStream(serverEvents)));

    const partials: string[] = [];
    const result = await getGeminiStreamingResponsePayload(
      [{ role: 'user', content: 'Recommend a movement' }],
      { fatigueScore: 2, fatigueZone: '🟢 Green', isMyelomaPatient: false },
      (text) => partials.push(text),
    );

    expect(partials).toEqual(['Provisional', '', 'Final recommendation']);
    expect(result).toEqual({
      text: 'Final recommendation',
      recommendations: [{ kind: 'movement', id: '1' }],
    });
  });

  it('preserves a diagnosed safe stream error instead of converting it to a connection failure', async () => {
    const safeError = 'ATHENA took too long to respond. Please try again.';
    const serverEvents = [
      'event: delta\ndata: {"text":"Partial"}\n\n',
      `event: error\ndata: ${JSON.stringify({ error: safeError })}\n\n`,
    ];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(responseStream(serverEvents)));

    const partials: string[] = [];
    const result = await getGeminiStreamingResponsePayload(
      [{ role: 'user', content: 'Hi' }],
      { fatigueScore: 2, fatigueZone: '🟢 Green', isMyelomaPatient: false },
      (text) => partials.push(text),
    );

    expect(result).toEqual({ text: safeError, recommendations: [] });
    expect(partials).toEqual(['Partial', safeError]);
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

  it('does not emit app-level done when the upstream direct stream ends without STOP', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    const truncated = encodeSse([
      { candidates: [{ content: { parts: [{ text: 'Partial upstream answer' }] } }] },
    ], false);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(responseStream([truncated])));

    const { out, res } = makeStreamRes();
    await handler(
      {
        method: 'POST',
        headers: { accept: 'text/event-stream', 'x-forwarded-for': '10.0.1.10' },
        body: {
          history: [{ role: 'user', content: 'Tell me something' }],
          context: { fatigueScore: 2, fatigueZone: '🟢 Green', isMyelomaPatient: false },
        },
      } as any,
      res as any,
    );

    const output = out.chunks.join('');
    expect(output).toContain('Partial upstream answer');
    expect(output).toContain('event: error');
    expect(output).not.toContain('event: done');
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

  it('streams one Movement and one Nutrition recommendation from the same bounded tool round', async () => {
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
                    id: 'movement-compound-1',
                    name: 'recommend_movement',
                    args: { preference: 'any', count: 1 },
                  },
                },
                {
                  functionCall: {
                    id: 'recipe-compound-1',
                    name: 'recommend_recipe',
                    args: { preference: 'any', count: 1 },
                  },
                },
              ],
            },
          },
        ],
      },
    ]);
    const second = encodeSse([
      { candidates: [{ content: { parts: [{ text: 'Here is one exercise and one recipe.' }] } }] },
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
          'x-forwarded-for': '10.0.1.20',
        },
        body: {
          history: [{ role: 'user', content: 'Can you give me one exercise and one recipe together?' }],
          context: { fatigueScore: 2, fatigueZone: '🟢 Green', isMyelomaPatient: false },
        },
      } as any,
      res as any,
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const synthesisBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    const responses = synthesisBody.contents.at(-1).parts.map((part: any) => part.functionResponse);
    expect(responses.map((response: any) => [response.id, response.name])).toEqual([
      ['movement-compound-1', 'recommend_movement'],
      ['recipe-compound-1', 'recommend_recipe'],
    ]);
    expect(responses[0].response.items.map((item: any) => item.id)).toEqual(['1']);
    expect(responses[1].response.items.map((item: any) => item.id)).toEqual(['3']);

    const output = out.chunks.join('');
    expect(output).toContain('Here is one exercise and one recipe.');
    expect(output).toContain('"kind":"movement","id":"1"');
    expect(output).toContain('"kind":"recipe","id":"3"');
    expect(output).toContain('event: done');
    expect(output).not.toContain('event: error');
  });

  it('recovers an empty streamed selection with one unary compound-tool retry', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    const emptySelection = encodeSse([
      { candidates: [{ content: { role: 'model', parts: [] } }] },
    ]);
    const unaryToolSelection = new Response(
      JSON.stringify({
        candidates: [
          {
            content: {
              role: 'model',
              parts: [
                {
                  functionCall: {
                    id: 'movement-recovered-1',
                    name: 'recommend_movement',
                    args: { preference: 'any', count: 1 },
                  },
                },
                {
                  functionCall: {
                    id: 'recipe-recovered-1',
                    name: 'recommend_recipe',
                    args: { preference: 'any', count: 1 },
                  },
                },
              ],
            },
            finishReason: 'STOP',
          },
        ],
      }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
    const synthesis = encodeSse([
      { candidates: [{ content: { parts: [{ text: 'Here is one exercise and one recipe.' }] } }] },
    ]);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(responseStream([emptySelection]))
      .mockResolvedValueOnce(unaryToolSelection)
      .mockResolvedValueOnce(responseStream([synthesis]));
    vi.stubGlobal('fetch', fetchMock);

    const { out, res } = makeStreamRes();
    await handler(
      {
        method: 'POST',
        headers: { accept: 'text/event-stream', 'x-forwarded-for': '10.0.1.21' },
        body: {
          history: [{ role: 'user', content: 'Give me one exercise and one recipe together' }],
          context: { fatigueScore: 4, fatigueZone: '🟡 Yellow', isMyelomaPatient: false },
        },
      } as any,
      res as any,
    );

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[0][0]).toContain(':streamGenerateContent?alt=sse');
    expect(fetchMock.mock.calls[1][0]).toContain(':generateContent');
    expect(fetchMock.mock.calls[1][0]).not.toContain(':streamGenerateContent');
    expect(fetchMock.mock.calls[2][0]).toContain(':streamGenerateContent?alt=sse');

    const firstPassBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    const recoveryBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(firstPassBody.generationConfig.thinkingConfig).toEqual({ thinkingBudget: 0 });
    expect(recoveryBody.generationConfig.thinkingConfig).toEqual({ thinkingBudget: 0 });

    const synthesisBody = JSON.parse(fetchMock.mock.calls[2][1].body);
    expect(synthesisBody.generationConfig.thinkingConfig).toEqual({ thinkingBudget: 0 });
    const responses = synthesisBody.contents.at(-1).parts.map((part: any) => part.functionResponse);
    expect(responses.map((response: any) => [response.id, response.name])).toEqual([
      ['movement-recovered-1', 'recommend_movement'],
      ['recipe-recovered-1', 'recommend_recipe'],
    ]);
    expect(responses[0].response.items).toHaveLength(1);
    expect(responses[1].response.items).toHaveLength(1);

    const output = out.chunks.join('');
    expect(output).toContain('Here is one exercise and one recipe.');
    expect(output).toContain('"kind":"movement"');
    expect(output).toContain('"kind":"recipe"');
    expect(output).toContain('event: done');
    expect(output).not.toContain('event: error');
  });

  it('recovers an empty streamed selection when the unary retry returns direct text', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    const emptySelection = encodeSse([
      { candidates: [{ content: { role: 'model', parts: [] } }] },
    ]);
    const unaryText = new Response(
      JSON.stringify({
        candidates: [
          {
            content: {
              role: 'model',
              parts: [{ text: 'I can help with that.' }],
            },
            finishReason: 'STOP',
          },
        ],
      }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(responseStream([emptySelection]))
      .mockResolvedValueOnce(unaryText);
    vi.stubGlobal('fetch', fetchMock);

    const { out, res } = makeStreamRes();
    await handler(
      {
        method: 'POST',
        headers: { accept: 'text/event-stream', 'x-forwarded-for': '10.0.1.22' },
        body: {
          history: [{ role: 'user', content: 'Can we just chat?' }],
          context: { fatigueScore: 4, fatigueZone: '🟡 Yellow', isMyelomaPatient: false },
        },
      } as any,
      res as any,
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const output = out.chunks.join('');
    expect(output).toContain('event: delta');
    expect(output).toContain('I can help with that.');
    expect(output).toContain('event: done');
    expect(output).toContain('"recommendations":[]');
    expect(output).not.toContain('event: error');
  });

  it('treats whitespace-only streamed selection as recoverable and resets it before tool synthesis', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    const whitespaceSelection = encodeSse([
      { candidates: [{ content: { role: 'model', parts: [{ text: '   ' }] } }] },
    ]);
    const unaryToolSelection = new Response(
      JSON.stringify({
        candidates: [
          {
            content: {
              role: 'model',
              parts: [
                {
                  functionCall: {
                    id: 'movement-whitespace-1',
                    name: 'recommend_movement',
                    args: { preference: 'any', count: 1 },
                  },
                },
                {
                  functionCall: {
                    id: 'recipe-whitespace-1',
                    name: 'recommend_recipe',
                    args: { preference: 'any', count: 1 },
                  },
                },
              ],
            },
            finishReason: 'STOP',
          },
        ],
      }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
    const synthesis = encodeSse([
      { candidates: [{ content: { parts: [{ text: 'Recovered recommendations.' }] } }] },
    ]);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(responseStream([whitespaceSelection]))
      .mockResolvedValueOnce(unaryToolSelection)
      .mockResolvedValueOnce(responseStream([synthesis]));
    vi.stubGlobal('fetch', fetchMock);

    const { out, res } = makeStreamRes();
    await handler(
      {
        method: 'POST',
        headers: { accept: 'text/event-stream', 'x-forwarded-for': '10.0.1.24' },
        body: {
          history: [{ role: 'user', content: 'Give me one exercise and one recipe together' }],
          context: { fatigueScore: 4, fatigueZone: '🟡 Yellow', isMyelomaPatient: false },
        },
      } as any,
      res as any,
    );

    expect(fetchMock).toHaveBeenCalledTimes(3);
    const output = out.chunks.join('');
    expect(output).toContain('event: reset');
    expect(output).toContain('Recovered recommendations.');
    expect(output).toContain('"kind":"movement"');
    expect(output).toContain('"kind":"recipe"');
    expect(output).toContain('event: done');
    expect(output).not.toContain('event: error');
  });

  it('resets provisional whitespace before emitting recovered direct text', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    const whitespaceSelection = encodeSse([
      { candidates: [{ content: { role: 'model', parts: [{ text: '    ' }] } }] },
    ]);
    const unaryText = new Response(
      JSON.stringify({
        candidates: [
          {
            content: {
              role: 'model',
              parts: [{ text: 'Recovered plain text.' }],
            },
            finishReason: 'STOP',
          },
        ],
      }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(responseStream([whitespaceSelection]))
      .mockResolvedValueOnce(unaryText);
    vi.stubGlobal('fetch', fetchMock);

    const { out, res } = makeStreamRes();
    await handler(
      {
        method: 'POST',
        headers: { accept: 'text/event-stream', 'x-forwarded-for': '10.0.1.27' },
        body: {
          history: [{ role: 'user', content: 'Can we just chat?' }],
          context: { fatigueScore: 4, fatigueZone: '🟡 Yellow', isMyelomaPatient: false },
        },
      } as any,
      res as any,
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const output = out.chunks.join('');
    expect(output).toContain('event: reset');
    expect(output.indexOf('event: reset')).toBeGreaterThan(output.indexOf('    '));
    expect(output.indexOf('Recovered plain text.')).toBeGreaterThan(output.indexOf('event: reset'));
    expect(output).toContain('event: done');
    expect(output).not.toContain('event: error');
  });

  it('rejects truncated unary text recovery instead of marking partial text done', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    const emptySelection = encodeSse([
      { candidates: [{ content: { role: 'model', parts: [] } }] },
    ]);
    const truncatedUnary = new Response(
      JSON.stringify({
        candidates: [
          {
            content: {
              role: 'model',
              parts: [{ text: 'Partial recovered answer' }],
            },
            finishReason: 'MAX_TOKENS',
          },
        ],
      }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(responseStream([emptySelection]))
      .mockResolvedValueOnce(truncatedUnary);
    vi.stubGlobal('fetch', fetchMock);

    const { out, res } = makeStreamRes();
    await handler(
      {
        method: 'POST',
        headers: { accept: 'text/event-stream', 'x-forwarded-for': '10.0.1.25' },
        body: {
          history: [{ role: 'user', content: 'Can we just chat?' }],
          context: { fatigueScore: 4, fatigueZone: '🟡 Yellow', isMyelomaPatient: false },
        },
      } as any,
      res as any,
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const output = out.chunks.join('');
    expect(output).toContain('ATHENA returned an incomplete response. Please try again.');
    expect(output).toContain('event: error');
    expect(output).not.toContain('Partial recovered answer');
    expect(output).not.toContain('event: done');
  });

  it('rejects truncated unary tool recovery before executing recommendations', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    const emptySelection = encodeSse([
      { candidates: [{ content: { role: 'model', parts: [] } }] },
    ]);
    const truncatedUnary = new Response(
      JSON.stringify({
        candidates: [
          {
            content: {
              role: 'model',
              parts: [
                {
                  functionCall: {
                    id: 'movement-partial-1',
                    name: 'recommend_movement',
                    args: { preference: 'any', count: 1 },
                  },
                },
              ],
            },
            finishReason: 'MAX_TOKENS',
          },
        ],
      }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(responseStream([emptySelection]))
      .mockResolvedValueOnce(truncatedUnary);
    vi.stubGlobal('fetch', fetchMock);

    const { out, res } = makeStreamRes();
    await handler(
      {
        method: 'POST',
        headers: { accept: 'text/event-stream', 'x-forwarded-for': '10.0.1.26' },
        body: {
          history: [{ role: 'user', content: 'Give me one exercise' }],
          context: { fatigueScore: 4, fatigueZone: '🟡 Yellow', isMyelomaPatient: false },
        },
      } as any,
      res as any,
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const output = out.chunks.join('');
    expect(output).toContain('ATHENA returned an incomplete response. Please try again.');
    expect(output).toContain('event: error');
    expect(output).not.toContain('"kind":"movement"');
    expect(output).not.toContain('event: done');
  });

  it('stops after one recovery attempt when both streamed and unary selection are empty', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const emptySelection = encodeSse([
      { candidates: [{ content: { role: 'model', parts: [] } }] },
    ]);
    const emptyUnary = new Response(
      JSON.stringify({
        candidates: [
          {
            content: {
              role: 'model',
              parts: [],
            },
            finishReason: 'STOP',
          },
        ],
      }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(responseStream([emptySelection]))
      .mockResolvedValueOnce(emptyUnary);
    vi.stubGlobal('fetch', fetchMock);

    const { out, res } = makeStreamRes();
    await handler(
      {
        method: 'POST',
        headers: { accept: 'text/event-stream', 'x-forwarded-for': '10.0.1.23' },
        body: {
          history: [{ role: 'user', content: 'Give me one exercise and one recipe together' }],
          context: { fatigueScore: 4, fatigueZone: '🟡 Yellow', isMyelomaPatient: false },
        },
      } as any,
      res as any,
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const output = out.chunks.join('');
    expect(output).toContain('ATHENA returned an invalid streaming response. Please try again.');
    expect(output).toContain('event: error');
    expect(output).not.toContain('event: done');

    expect(warnSpy).toHaveBeenCalledWith(
      '[gemini] selection recovery exhausted',
      expect.objectContaining({
        stream: expect.objectContaining({ finishReason: 'STOP', partCount: 0 }),
        recovery: expect.objectContaining({ finishReason: 'STOP', partCount: 0 }),
        functionCallCount: 0,
        modelPartCount: 0,
      }),
    );
    const logged = JSON.stringify(warnSpy.mock.calls);
    expect(logged).not.toContain('Give me one exercise and one recipe together');
  });

  it('does not emit app-level done or recommendation refs when tool synthesis ends without STOP', async () => {
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
                    id: 'movement-call-truncated',
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
    const truncatedSynthesis = encodeSse([
      { candidates: [{ content: { parts: [{ text: 'Partial tool synthesis' }] } }] },
    ], false);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(responseStream([first]))
      .mockResolvedValueOnce(responseStream([truncatedSynthesis]));
    vi.stubGlobal('fetch', fetchMock);

    const { out, res } = makeStreamRes();
    await handler(
      {
        method: 'POST',
        headers: { accept: 'text/event-stream', 'x-forwarded-for': '10.0.1.11' },
        body: {
          history: [{ role: 'user', content: 'Recommend an exercise' }],
          context: { fatigueScore: 1, fatigueZone: '🟢 Green', isMyelomaPatient: false },
        },
      } as any,
      res as any,
    );

    const output = out.chunks.join('');
    expect(output).toContain('Partial tool synthesis');
    expect(output).toContain('event: error');
    expect(output).not.toContain('event: done');
    expect(output).not.toContain('"kind":"movement"');
  });

  it('resets streamed first-pass prose if a later chunk switches to a catalogue tool', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    const first = encodeSse([
      { candidates: [{ content: { role: 'model', parts: [{ text: 'Let me pick something. ' }] } }] },
      {
        candidates: [
          {
            content: {
              role: 'model',
              parts: [
                {
                  functionCall: {
                    id: 'late-call-1',
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
      { candidates: [{ content: { parts: [{ text: 'Here are the actual Green options.' }] } }] },
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
        headers: { accept: 'text/event-stream', 'x-forwarded-for': '10.0.1.3' },
        body: {
          history: [{ role: 'user', content: 'Recommend an exercise' }],
          context: { fatigueScore: 1, fatigueZone: '🟢 Green', isMyelomaPatient: false },
        },
      } as any,
      res as any,
    );

    const output = out.chunks.join('');
    expect(output.indexOf('Let me pick something.')).toBeGreaterThanOrEqual(0);
    expect(output.indexOf('event: reset')).toBeGreaterThan(output.indexOf('Let me pick something.'));
    expect(output.indexOf('Here are the actual Green options.')).toBeGreaterThan(output.indexOf('event: reset'));

    const synthesisBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    const modelParts = synthesisBody.contents.at(-2).parts;
    expect(modelParts.some((part: any) => part.text === 'Let me pick something. ')).toBe(true);
    expect(modelParts.some((part: any) => part.functionCall?.id === 'late-call-1')).toBe(true);
  });

  it('preserves distinct same-function calls when Gemini omits optional call IDs', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    const first = encodeSse([
      {
        candidates: [
          {
            content: {
              role: 'model',
              parts: [
                { functionCall: { name: 'recommend_movement', args: { preference: 'any' } } },
                { functionCall: { name: 'recommend_movement', args: { preference: 'any' } } },
              ],
            },
          },
        ],
      },
    ]);
    const second = encodeSse([
      { candidates: [{ content: { parts: [{ text: 'Two calls were handled.' }] } }] },
    ]);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(responseStream([first]))
      .mockResolvedValueOnce(responseStream([second]));
    vi.stubGlobal('fetch', fetchMock);

    const { res } = makeStreamRes();
    await handler(
      {
        method: 'POST',
        headers: { accept: 'text/event-stream', 'x-forwarded-for': '10.0.1.4' },
        body: {
          history: [{ role: 'user', content: 'Give me two movement requests' }],
          context: { fatigueScore: 1, fatigueZone: '🟢 Green', isMyelomaPatient: false },
        },
      } as any,
      res as any,
    );

    const synthesisBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    const modelCallParts = synthesisBody.contents.at(-2).parts.filter((part: any) => part.functionCall);
    const responseParts = synthesisBody.contents.at(-1).parts;

    expect(modelCallParts).toHaveLength(2);
    expect(responseParts).toHaveLength(2);
    expect(responseParts.every((part: any) => part.functionResponse.name === 'recommend_movement')).toBe(true);
  });
});
