import { afterEach, describe, expect, it, vi } from "vitest";
import handler from "../api/gemini";

type RequestRecord = { url: string; body: Record<string, any> };
const sse = (payload: unknown) => new Response(`data: ${JSON.stringify(payload)}\n\n`, {
  status: 200,
  headers: { "Content-Type": "text/event-stream" },
});
const json = (payload: unknown) => new Response(JSON.stringify(payload), {
  status: 200,
  headers: { "Content-Type": "application/json" },
});
const candidate = (parts: unknown[], finishReason = "STOP") => ({
  candidates: [{ content: { role: "model", parts }, finishReason }],
});
const makeStreamingResponse = () => {
  const out: { status?: number; body?: unknown; headers: Record<string, string>; chunks: string[]; ended: boolean } = {
    headers: {}, chunks: [], ended: false,
  };
  return {
    out,
    res: {
      status: (code: number) => ({ json: (body: unknown) => { out.status = code; out.body = body; } }),
      setHeader: (name: string, value: string) => { out.headers[name] = value; },
      write: (chunk: string) => { out.chunks.push(chunk); },
      end: () => { out.ended = true; },
      flushHeaders: () => undefined,
    },
  };
};
const run = async (history: { role: "user" | "model"; content: string }[], fetchMock: ReturnType<typeof vi.fn>, context?: { fatigueScore: number }) => {
  process.env.GEMINI_API_KEY = "synthetic-test-key";
  process.env.ATHENA_TRANSPORT = "sdk";
  vi.stubGlobal("fetch", fetchMock);
  const output = makeStreamingResponse();
  await handler({
    method: "POST",
    headers: { accept: "text/event-stream", "x-forwarded-for": `10.1.0.${Math.floor(Math.random() * 200) + 1}` },
    body: { history, ...(context ? { context } : {}) },
  } as any, output.res as any);
  return output.out;
};
const resetEnvironment = () => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  delete process.env.GEMINI_API_KEY;
  delete process.env.ATHENA_TRANSPORT;
  delete process.env.CHAT_ACCESS_PASSWORD;
  delete process.env.FFC_CHAT_ACCESS_PASSWORD;
};

afterEach(resetEnvironment);

describe("/api/gemini SDK transport", () => {
  it("streams visible text as app delta and completes with done", async () => {
    const diagnostic = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const requests: RequestRecord[] = [];
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      requests.push({ url: String(input), body: JSON.parse(String(init?.body)) });
      return sse(candidate([
        { text: "private synthetic thought", thought: true },
        { text: "Hello from synthetic ATHENA." },
      ]));
    });
    const out = await run([{ role: "user", content: "Synthetic question" }], fetchMock);
    expect(out.chunks.join("")).toContain('event: delta');
    expect(out.chunks.join("")).toContain('Hello from synthetic ATHENA.');
    expect(out.chunks.join("")).not.toContain('private synthetic thought');
    expect(out.chunks.join("")).toContain('event: done');
    expect(requests).toHaveLength(1);
    expect(diagnostic).toHaveBeenCalledWith("[athena] generation", expect.objectContaining({
      requestId: expect.stringMatching(/^[a-f0-9]{12}$/),
      model: "gemini-2.5-flash",
      transport: "google-generate-content",
      callCount: 1,
      recoveryCount: 0,
      finishReason: "stop",
    }));
    expect(JSON.stringify(diagnostic.mock.calls)).not.toContain("Hello from synthetic ATHENA.");
    expect(requests[0].url).toContain("gemini-2.5-flash:streamGenerateContent");
  });

  it("synthesizes SDK tool results with original conversation history", async () => {
    const requests: RequestRecord[] = [];
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const body = JSON.parse(String(init?.body));
      requests.push({ url, body });
      if (url.includes(":streamGenerateContent")) {
        return requests.length === 1
          ? sse(candidate([
            { functionCall: { id: "recipe-call", name: "recommend_recipe", args: { count: 1 } } },
            { functionCall: { id: "movement-call", name: "recommend_movement", args: { count: 1 } } },
          ]))
          : sse(candidate([{ text: "Here are synthetic recipe and movement suggestions." }]));
      }
      throw new Error(`Unexpected provider route ${url}`);
    });
    const history = [
      { role: "user" as const, content: "Earlier synthetic context" },
      { role: "model" as const, content: "Earlier synthetic reply" },
      { role: "user" as const, content: "Recommend one recipe" },
    ];
    const out = await run(history, fetchMock, { fatigueScore: 3 });
    expect(out.chunks.join("")).toContain("event: done");
    expect(requests).toHaveLength(2);
    const synthesisContents = requests[1].body.contents;
    expect(synthesisContents.slice(0, 3)).toEqual([
      { role: "user", parts: [{ text: "Earlier synthetic context" }] },
      { role: "model", parts: [{ text: "Earlier synthetic reply" }] },
      { role: "user", parts: [{ text: "Recommend one recipe" }] },
    ]);
    expect(JSON.stringify(synthesisContents)).toContain("recipe-call");
    expect(JSON.stringify(synthesisContents)).toContain("movement-call");
    expect(JSON.stringify(synthesisContents)).toContain("functionResponse");
    expect(requests[1].body.toolConfig.functionCallingConfig.mode).toBe("NONE");
    const doneEvent = out.chunks.find((chunk) => chunk.startsWith("event: done"));
    expect(doneEvent).toContain('"kind":"recipe"');
    expect(doneEvent).toContain('"kind":"movement"');
  });

  it("uses unary recovery tool-call messages as synthesis context", async () => {
    const requests: RequestRecord[] = [];
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const body = JSON.parse(String(init?.body));
      requests.push({ url, body });
      if (url.includes(":streamGenerateContent")) {
        return requests.length === 1
          ? sse(candidate([]))
          : sse(candidate([{ text: "Recovered synthesis answer." }]));
      }
      if (url.includes(":generateContent")) {
        return json(candidate([{ functionCall: { id: "recovered-call", name: "recommend_recipe", args: { count: 1 } } }]));
      }
      throw new Error(`Unexpected provider route ${url}`);
    });
    const out = await run([
      { role: "user", content: "Earlier synthetic question" },
      { role: "model", content: "Earlier synthetic answer" },
      { role: "user", content: "Recommend one recipe" },
    ], fetchMock);
    expect(out.chunks.join("")).toContain("event: done");
    expect(requests).toHaveLength(3);
    const synthesisContents = requests[2].body.contents;
    expect(synthesisContents.slice(0, 3).map((message: any) => message.parts?.[0]?.text)).toEqual([
      "Earlier synthetic question", "Earlier synthetic answer", "Recommend one recipe",
    ]);
    expect(JSON.stringify(synthesisContents)).toContain("recovered-call");
  });
});
