import { afterEach, describe, expect, it, vi } from 'vitest';
import handler from '../api/gemini';

const makeRes = () => {
  const out: { status?: number; body?: unknown } = {};
  return {
    out,
    res: {
      status: (code: number) => ({
        json: (body: unknown) => {
          out.status = code;
          out.body = body;
        },
      }),
    },
  };
};

const successfulGeminiFetch = () =>
  vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    text: async () =>
      JSON.stringify({
        candidates: [{ content: { parts: [{ text: 'general information' }] } }],
      }),
  });

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.GEMINI_API_KEY;
});

describe('ATHENA blood-cancer prompt alignment', () => {
  it('keeps the broad blood selector generic when no family is named', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    const fetchMock = successfulGeminiFetch();
    vi.stubGlobal('fetch', fetchMock);

    const { out, res } = makeRes();
    await handler(
      {
        method: 'POST',
        headers: { 'x-forwarded-for': '10.1.0.1' },
        body: {
          history: [{ role: 'user', content: 'I have blood cancer. What treatments are around?' }],
          context: {
            fatigueScore: 5,
            fatigueZone: '🟡 Yellow',
            isMyelomaPatient: true,
            cancerType: 'blood_myeloma',
          },
        },
      } as any,
      res as any,
    );

    expect(out.status).toBe(200);
    const forwardedBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    const instruction = forwardedBody.systemInstruction.parts[0].text;

    expect(instruction).toContain('TREATMENT INFORMATION — BLOOD CANCER');
    expect(instruction).not.toContain('TREATMENT INFORMATION — MYELOMA');
    expect(instruction).toContain('1. BLOOD CANCER');
    expect(instruction).not.toContain('Bone safety without assumptions');
  });

  it('routes AML treatment information without injecting myeloma supportive-care rules', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    const fetchMock = successfulGeminiFetch();
    vi.stubGlobal('fetch', fetchMock);

    const { out, res } = makeRes();
    await handler(
      {
        method: 'POST',
        headers: { 'x-forwarded-for': '10.1.0.2' },
        body: {
          history: [{ role: 'user', content: 'I have blood cancer, AML. What treatments are generally used?' }],
          context: {
            fatigueScore: 5,
            fatigueZone: '🟡 Yellow',
            isMyelomaPatient: true,
            cancerType: 'blood_myeloma',
          },
        },
      } as any,
      res as any,
    );

    expect(out.status).toBe(200);
    const forwardedBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    const instruction = forwardedBody.systemInstruction.parts[0].text;

    expect(instruction).toContain('TREATMENT INFORMATION — LEUKAEMIA');
    expect(instruction).toContain('1. BLOOD CANCER');
    expect(instruction).not.toContain('Bone safety without assumptions');
    expect(instruction).not.toContain('TREATMENT INFORMATION — MYELOMA');
  });

  it('routes CLL treatment information without injecting myeloma supportive-care rules', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    const fetchMock = successfulGeminiFetch();
    vi.stubGlobal('fetch', fetchMock);

    const { out, res } = makeRes();
    await handler(
      {
        method: 'POST',
        headers: { 'x-forwarded-for': '10.1.0.3' },
        body: {
          history: [{ role: 'user', content: 'I have chronic lymphocytic leukaemia.' }],
          context: {
            fatigueScore: 5,
            fatigueZone: '🟡 Yellow',
            isMyelomaPatient: true,
            cancerType: 'blood_myeloma',
          },
        },
      } as any,
      res as any,
    );

    expect(out.status).toBe(200);
    const forwardedBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    const instruction = forwardedBody.systemInstruction.parts[0].text;

    expect(instruction).toContain('TREATMENT INFORMATION — LYMPHOMA / CLL');
    expect(instruction).toContain('1. BLOOD CANCER');
    expect(instruction).not.toContain('Bone safety without assumptions');
    expect(instruction).not.toContain('TREATMENT INFORMATION — MYELOMA');
  });
});