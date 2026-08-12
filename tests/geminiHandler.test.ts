import { describe, it, expect, vi, afterEach } from "vitest";
import handler from "../api/gemini";

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

const getForwardedGeminiBody = (fetchMock: ReturnType<typeof vi.fn>, call = 0) =>
  JSON.parse(fetchMock.mock.calls[call][1].body);

const successfulGeminiFetch = (text = "hello") =>
  vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    text: async () =>
      JSON.stringify({
        candidates: [{ content: { parts: [{ text }] } }],
      }),
  });

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.GEMINI_API_KEY;
  delete process.env.CHAT_ACCESS_PASSWORD;
  delete process.env.FFC_CHAT_ACCESS_PASSWORD;
});

describe("/api/gemini handler", () => {
  it("returns 405 for GET requests", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    const { out, res } = makeRes();
    await handler({ method: "GET", headers: { "x-forwarded-for": "10.0.0.1" } } as any, res as any);
    expect(out.status).toBe(405);
    expect((out.body as any).error).toContain("Method not allowed");
  });

  it("accepts a valid minimal body and forwards to Gemini with x-goog-api-key header", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    const fetchMock = successfulGeminiFetch("hello");
    vi.stubGlobal("fetch", fetchMock);

    const { out, res } = makeRes();
    await handler(
      {
        method: "POST",
        headers: { "x-forwarded-for": "10.0.0.2" },
        body: { history: [{ role: "user", content: "hi" }] },
      } as any,
      res as any,
    );

    expect(out.status).toBe(200);
    expect((out.body as any).text).toBe("hello");

    const fetchArgs = fetchMock.mock.calls[0];
    expect(fetchArgs[0]).not.toContain("key=");
    expect(fetchArgs[1].headers["x-goog-api-key"]).toBe("test-key");
  });

  it("rejects 41 messages as too long (MAX_HISTORY_MESSAGES=40)", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const history = Array.from({ length: 41 }, (_, i) => ({
      role: "user" as const,
      content: `message ${i}`,
    }));
    const { out, res } = makeRes();
    await handler(
      {
        method: "POST",
        headers: { "x-forwarded-for": "10.0.0.3" },
        body: { history },
      } as any,
      res as any,
    );

    expect(out.status).toBe(400);
    expect((out.body as any).error).toBe("Request history is too long");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a message with content > 16000 chars", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { out, res } = makeRes();
    await handler(
      {
        method: "POST",
        headers: { "x-forwarded-for": "10.0.0.4" },
        body: { history: [{ role: "user", content: "x".repeat(16001) }] },
      } as any,
      res as any,
    );

    expect(out.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects total content > 200000 chars", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const history = Array.from({ length: 14 }, () => ({
      role: "user" as const,
      content: "x".repeat(15000),
    }));
    const { out, res } = makeRes();
    await handler(
      {
        method: "POST",
        headers: { "x-forwarded-for": "10.0.0.5" },
        body: { history },
      } as any,
      res as any,
    );

    expect(out.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("accepts a realistic multi-turn conversation with a long assistant reply", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    const fetchMock = successfulGeminiFetch("more ideas");
    vi.stubGlobal("fetch", fetchMock);

    const longAssistantReply = "A detailed requested explanation. ".repeat(250);
    expect(longAssistantReply.length).toBeGreaterThan(4000);

    const { out, res } = makeRes();
    await handler(
      {
        method: "POST",
        headers: { "x-forwarded-for": "10.0.0.11" },
        body: {
          history: [
            { role: "user", content: "I'd like some movement ideas." },
            { role: "model", content: longAssistantReply },
            { role: "user", content: "What else could I try?" },
          ],
          context: { fatigueScore: 3, fatigueZone: "🟢 Green", isMyelomaPatient: false },
        },
      } as any,
      res as any,
    );

    expect(out.status).toBe(200);
    expect((out.body as any).text).toBe("more ideas");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("rejects invalid role 'system'", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { out, res } = makeRes();
    await handler(
      {
        method: "POST",
        headers: { "x-forwarded-for": "10.0.0.6" },
        body: { history: [{ role: "system", content: "be helpful" }] },
      } as any,
      res as any,
    );

    expect(out.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects non-string content", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { out, res } = makeRes();
    await handler(
      {
        method: "POST",
        headers: { "x-forwarded-for": "10.0.0.7" },
        body: { history: [{ role: "user", content: 42 }] },
      } as any,
      res as any,
    );

    expect(out.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects invalid cancerType 'everything'", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { out, res } = makeRes();
    await handler(
      {
        method: "POST",
        headers: { "x-forwarded-for": "10.0.0.8" },
        body: {
          history: [{ role: "user", content: "hi" }],
          cancerType: "everything",
        },
      } as any,
      res as any,
    );

    expect(out.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects context with out-of-range fatigueScore", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { out, res } = makeRes();
    await handler(
      {
        method: "POST",
        headers: { "x-forwarded-for": "10.0.0.9" },
        body: {
          history: [{ role: "user", content: "hi" }],
          context: { fatigueScore: 99, fatigueZone: null, isMyelomaPatient: false },
        },
      } as any,
      res as any,
    );

    expect(out.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("accepts a valid body with full context and returns 200", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    const fetchMock = successfulGeminiFetch("adjusted advice");
    vi.stubGlobal("fetch", fetchMock);

    const { out, res } = makeRes();
    await handler(
      {
        method: "POST",
        headers: { "x-forwarded-for": "10.0.0.10" },
        body: {
          history: [{ role: "user", content: "hi" }],
          context: {
            fatigueScore: 7,
            fatigueZone: "🔴 Red",
            isMyelomaPatient: false,
            cancerType: "lung",
          },
        },
      } as any,
      res as any,
    );

    expect(out.status).toBe(200);
    expect((out.body as any).text).toBe("adjusted advice");
  });

  it("forwards the ATHENA companion instruction with silent energy and cancer context", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    const fetchMock = successfulGeminiFetch("That sounds rough. Let's keep it simple.");
    vi.stubGlobal("fetch", fetchMock);

    const { out, res } = makeRes();
    await handler(
      {
        method: "POST",
        headers: { "x-forwarded-for": "10.0.0.12" },
        body: {
          history: [{ role: "user", content: "I'm wiped out and my legs ache today." }],
          context: {
            fatigueScore: 8,
            fatigueZone: "🔴 Red",
            isMyelomaPatient: false,
            cancerType: "lung",
          },
        },
      } as any,
      res as any,
    );

    expect(out.status).toBe(200);
    const forwardedBody = getForwardedGeminiBody(fetchMock);
    const systemInstruction = forwardedBody.systemInstruction.parts[0].text;

    expect(systemInstruction).toContain("You are ATHENA");
    expect(systemInstruction).toContain("Selected energy score: 8/10");
    expect(systemInstruction).toContain("Internal energy band: 🔴 Red");
    expect(systemInstruction).toContain("Cancer context: Lung");
    expect(systemInstruction).toContain("Do NOT append a references section by default");
    expect(systemInstruction).toContain("I don't have a physical body");
    expect(systemInstruction).toContain("least cognitively demanding response");
    expect(systemInstruction).toContain("VERIFIED SOURCE LIST — ONLY SURFACE");
    expect(systemInstruction).not.toContain("TGA Compliance");
    expect(systemInstruction).not.toContain("Because you're in the Red Zone");
    expect(systemInstruction).not.toContain("### Verified Resources");
    expect(forwardedBody.contents).toEqual([
      {
        role: "user",
        parts: [{ text: "I'm wiped out and my legs ache today." }],
      },
    ]);
  });

  it("keeps the same companion guardrails across turns without a forced first-response disclaimer", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    const fetchMock = successfulGeminiFetch("guidance");
    vi.stubGlobal("fetch", fetchMock);

    const { out: firstOut, res: firstRes } = makeRes();
    await handler(
      {
        method: "POST",
        headers: { "x-forwarded-for": "10.0.0.13" },
        body: {
          history: [{ role: "user", content: "I'd like help with nutrition." }],
          context: { fatigueScore: 4, fatigueZone: "🟡 Yellow", isMyelomaPatient: false },
        },
      } as any,
      firstRes as any,
    );

    expect(firstOut.status).toBe(200);
    const firstInstruction = getForwardedGeminiBody(fetchMock, 0).systemInstruction.parts[0].text;

    const { out: followUpOut, res: followUpRes } = makeRes();
    await handler(
      {
        method: "POST",
        headers: { "x-forwarded-for": "10.0.0.14" },
        body: {
          history: [
            { role: "user", content: "I'd like help with nutrition." },
            { role: "model", content: "What is hardest about food today?" },
            { role: "user", content: "I can't face cooking." },
          ],
          context: { fatigueScore: 4, fatigueZone: "🟡 Yellow", isMyelomaPatient: false },
        },
      } as any,
      followUpRes as any,
    );

    expect(followUpOut.status).toBe(200);
    const followUpInstruction = getForwardedGeminiBody(fetchMock, 1).systemInstruction.parts[0].text;

    for (const instruction of [firstInstruction, followUpInstruction]) {
      expect(instruction).toContain("Do NOT append a references section by default");
      expect(instruction).toContain("Keep guardrails firm but proportional");
      expect(instruction).not.toContain("Because this is your first response in the current session");
      expect(instruction).not.toContain("Always include a disclaimer");
    }
  });
});

describe("/api/gemini access gate", () => {
  it("returns 401 when gate is enabled and no header is sent", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    process.env.CHAT_ACCESS_PASSWORD = "letmein";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { out, res } = makeRes();
    await handler(
      {
        method: "POST",
        headers: { "x-forwarded-for": "10.0.200.1" },
        body: { history: [{ role: "user", content: "hi" }] },
      } as any,
      res as any,
    );

    expect(out.status).toBe(401);
    expect((out.body as any).error).toBe("Chat access is restricted");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 401 when gate is enabled and wrong header is sent", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    process.env.CHAT_ACCESS_PASSWORD = "letmein";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { out, res } = makeRes();
    await handler(
      {
        method: "POST",
        headers: { "x-forwarded-for": "10.0.200.2", "x-chat-access-password": "wrong" },
        body: { history: [{ role: "user", content: "hi" }] },
      } as any,
      res as any,
    );

    expect(out.status).toBe(401);
    expect((out.body as any).error).toBe("Chat access is restricted");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 200 when gate is enabled and correct header is sent", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    process.env.CHAT_ACCESS_PASSWORD = "letmein";
    const fetchMock = successfulGeminiFetch("ok");
    vi.stubGlobal("fetch", fetchMock);

    const { out, res } = makeRes();
    await handler(
      {
        method: "POST",
        headers: { "x-forwarded-for": "10.0.200.3", "x-chat-access-password": "letmein" },
        body: { history: [{ role: "user", content: "hi" }] },
      } as any,
      res as any,
    );

    expect(out.status).toBe(200);
    expect(fetchMock).toHaveBeenCalled();
  });

  it("returns 200 when gate is disabled and no header is sent", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    delete process.env.CHAT_ACCESS_PASSWORD;
    delete process.env.FFC_CHAT_ACCESS_PASSWORD;
    const fetchMock = successfulGeminiFetch("ok");
    vi.stubGlobal("fetch", fetchMock);

    const { out, res } = makeRes();
    await handler(
      {
        method: "POST",
        headers: { "x-forwarded-for": "10.0.200.4" },
        body: { history: [{ role: "user", content: "hi" }] },
      } as any,
      res as any,
    );

    expect(out.status).toBe(200);
    expect(fetchMock).toHaveBeenCalled();
  });
});
