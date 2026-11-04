import { afterEach, describe, expect, it, vi } from 'vitest';
import handler from '../api/gemini';

const candidate = (parts: unknown[], finishReason?: string) => ({
  candidates: [{ content: { role: 'model', parts }, ...(finishReason ? { finishReason } : {}) }],
});
const reply = (payloads: unknown[], streaming: boolean) => new Response(
  streaming ? payloads.map(p => `data: ${JSON.stringify(p)}\n\n`).join('') : JSON.stringify(payloads[0]),
  { headers: { 'Content-Type': streaming ? 'text/event-stream' : 'application/json' } },
);
let requestId = 0;
const invoke = async (transport: string, streaming: boolean, history = [{ role: 'user', content: 'Suggest a recipe and gentle movement.' }]) => {
  process.env.GEMINI_API_KEY = 'synthetic-test-key';
  process.env.ATHENA_TRANSPORT = transport;
  const out = { status: 0, body: undefined as any, chunks: [] as string[] };
  await handler({ method: 'POST', headers: {
    'x-forwarded-for': `migration-${++requestId}`,
    ...(streaming ? { accept: 'text/event-stream' } : {}),
  }, body: { history, context: { fatigueScore: 8 } } } as any, {
    status: (code: number) => ({ json: (body: unknown) => { out.status = code; out.body = body; } }),
    setHeader: () => {}, flushHeaders: () => {}, end: () => {},
    write: (chunk: string) => out.chunks.push(chunk),
  } as any);
  return out;
};
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete process.env.GEMINI_API_KEY;
  delete process.env.ATHENA_TRANSPORT;
});

describe.each(['legacy', 'sdk'])('Gemini 3 migration: %s', transport => {
  it.each([false, true])('preserves signed parallel tool calls and hides thoughts (stream=%s)', async streaming => {
    const requests: any[] = [];
    const signedCall = { thoughtSignature: 'synthetic-call-signature', functionCall: {
      id: 'recipe-1', name: 'recommend_recipe', args: { count: 1 },
    } };
    const movementCall = { functionCall: { id: 'movement-1', name: 'recommend_movement', args: { count: 1 } } };
    const mock = vi.fn(async (url: any, init: any) => {
      const body = JSON.parse(init.body);
      requests.push(body);
      expect(String(url)).toContain('gemini-3.6-flash:');
      expect(body.generationConfig).toMatchObject({ maxOutputTokens: 4096, thinkingConfig: { thinkingLevel: 'medium' } });
      for (const key of ['temperature', 'topP', 'topK', 'candidateCount']) expect(body.generationConfig).not.toHaveProperty(key);
      expect(body.generationConfig.thinkingConfig).not.toHaveProperty('thinkingBudget');
      return reply([candidate(requests.length === 1 ? [
        { text: 'SYNTHETIC_PRIVATE_THOUGHT', thought: true }, signedCall, movementCall,
      ] : [{ text: 'SYNTHETIC_PRIVATE_THOUGHT', thought: true }, { text: 'Here are your suggestions.' }], 'STOP')], streaming);
    });
    vi.stubGlobal('fetch', mock);
    const out = await invoke(transport, streaming);
    expect(requests).toHaveLength(2);
    const contents = requests[1].contents;
    expect(contents.at(-2).parts).toContainEqual(signedCall);
    const results = contents.at(-1).parts.map((p: any) => p.functionResponse);
    expect(results).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'recipe-1', name: 'recommend_recipe' }),
      expect.objectContaining({ id: 'movement-1', name: 'recommend_movement' }),
    ]));
    const output = streaming ? out.chunks.join('') : JSON.stringify(out.body);
    expect(output).toContain('Here are your suggestions.');
    expect(output).not.toContain('SYNTHETIC_PRIVATE_THOUGHT');
    expect(output).not.toContain('synthetic-call-signature');
    if (streaming) expect(output).toContain('event: done');
    else expect(out.status).toBe(200);
  });

  it.each([false, true])('ends with an error when the whole-request deadline expires (stream=%s)', async streaming => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn((_url: unknown, init: any) => new Promise((_resolve, reject) => {
      const abort = () => reject(new DOMException('Synthetic timeout', 'AbortError'));
      if (init.signal.aborted) abort();
      else init.signal.addEventListener('abort', abort, { once: true });
    })));
    const pending = invoke(transport, streaming);
    await vi.advanceTimersByTimeAsync(25_001);
    const out = await pending;
    if (streaming && out.chunks.length > 0) {
      expect(out.chunks.join('')).toContain('event: error');
      expect(out.chunks.join('')).not.toContain('event: done');
    } else {
      expect(out.status).toBeGreaterThanOrEqual(500);
      expect(out.body.error).toBeTruthy();
    }
  });

  it.each([false, true])('handles an upstream rejection without reporting success (stream=%s)', async streaming => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ error: { message: 'Synthetic rejection' } }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    })));
    const out = await invoke(transport, streaming);
    if (streaming && out.chunks.length > 0) {
      expect(out.chunks.join('')).toContain('event: error');
      expect(out.chunks.join('')).not.toContain('event: done');
    } else {
      expect(out.status).toBeGreaterThanOrEqual(400);
      expect(out.body.error).toBeTruthy();
    }
  });

  it('accepts signature-only streaming chunks without displaying them', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => reply([
      candidate([{ text: 'SYNTHETIC_PRIVATE_THOUGHT', thought: true }]),
      candidate([{ text: 'Hello.' }]),
      candidate([{ thoughtSignature: 'synthetic-final-signature' }]),
      candidate([], 'STOP'),
    ], true)));
    const out = await invoke(transport, true);
    expect(out.chunks.join('')).toContain('Hello.');
    expect(out.chunks.join('')).toContain('event: done');
    expect(out.chunks.join('')).not.toContain('SYNTHETIC_PRIVATE_THOUGHT');
    expect(out.chunks.join('')).not.toContain('synthetic-final-signature');
  });

  it.each([
    [{ role: 'user', content: 'Hello' }, { role: 'model', content: 'Prefill' }],
    [{ role: 'user', content: '   ' }],
  ])('rejects invalid final history turns locally: %j', async (...messages) => {
    const mock = vi.fn();
    vi.stubGlobal('fetch', mock);
    const out = await invoke(transport, false, messages);
    expect(out.status).toBe(400);
    expect(mock).not.toHaveBeenCalled();
  });
});
