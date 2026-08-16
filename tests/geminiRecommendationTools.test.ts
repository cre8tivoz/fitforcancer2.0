import { afterEach, describe, expect, it, vi } from "vitest";
import handler from "../api/gemini";

const makeRes = () => {
  const out: { status?: number; body?: any } = {};
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

const geminiResponse = (payload: unknown) => ({
  ok: true,
  status: 200,
  text: async () => JSON.stringify(payload),
});

const requestBody = (message: string, fatigueZone: "🟢 Green" | "🟡 Yellow" | "🔴 Red" | null = "🔴 Red") => ({
  history: [{ role: "user", content: message }],
  context: {
    fatigueScore: fatigueZone === null ? null : fatigueZone === "🔴 Red" ? 8 : fatigueZone === "🟡 Yellow" ? 5 : 2,
    fatigueZone,
    isMyelomaPatient: false,
  },
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.GEMINI_API_KEY;
  delete process.env.CHAT_ACCESS_PASSWORD;
  delete process.env.FFC_CHAT_ACCESS_PASSWORD;
});

describe("/api/gemini first-party recommendation tools", () => {
  it("declares recommendation tools but keeps ordinary chat to one Gemini request", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    const fetchMock = vi.fn().mockResolvedValue(
      geminiResponse({ candidates: [{ content: { role: "model", parts: [{ text: "We can just chat." }] } }] }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { out, res } = makeRes();
    await handler(
      {
        method: "POST",
        headers: { "x-forwarded-for": "10.20.0.1" },
        body: requestBody("Treatment day is boring."),
      } as any,
      res as any,
    );

    expect(out.status).toBe(200);
    expect(out.body).toEqual({ text: "We can just chat." });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const forwarded = JSON.parse(fetchMock.mock.calls[0][1].body);
    const declarations = forwarded.tools[0].functionDeclarations;
    expect(declarations.map((tool: any) => tool.name)).toEqual([
      "recommend_movement",
      "recommend_recipe",
    ]);
    expect(forwarded.systemInstruction.parts[0].text).toContain(
      "Never claim a specific item is \"in the app\" unless the tool returned it",
    );
  });

  it("executes a movement tool against the current fatigue band and synthesises the reply", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    const toolContent = {
      role: "model",
      parts: [
        {
          functionCall: {
            name: "recommend_movement",
            args: { preference: "seated" },
          },
        },
      ],
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(geminiResponse({ candidates: [{ content: toolContent }] }))
      .mockResolvedValueOnce(
        geminiResponse({
          candidates: [
            {
              content: {
                role: "model",
                parts: [{ text: "Try Ankle Flex & Point or Seated Shoulder Shrugs from the app." }],
              },
            },
          ],
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const { out, res } = makeRes();
    await handler(
      {
        method: "POST",
        headers: { "x-forwarded-for": "10.20.0.2" },
        body: requestBody("Anything seated from the app?"),
      } as any,
      res as any,
    );

    expect(out.status).toBe(200);
    expect(out.body.text).toContain("Ankle Flex & Point");
    expect(out.body.recommendations).toEqual([
      { kind: "movement", id: "16" },
      { kind: "movement", id: "17" },
      { kind: "movement", id: "18" },
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const synthesisBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(synthesisBody.toolConfig.functionCallingConfig.mode).toBe("NONE");
    expect(synthesisBody.contents.at(-2)).toEqual(toolContent);

    const functionResponse = synthesisBody.contents.at(-1).parts[0].functionResponse;
    expect(functionResponse.name).toBe("recommend_movement");
    expect(functionResponse.response).toMatchObject({
      status: "ok",
      zone: "Red",
      preference: "seated",
      preferenceMatched: true,
    });
    expect(functionResponse.response.items.map((item: any) => item.id)).toEqual(["16", "17", "18"]);
  });

  it("can execute movement and recipe recommendations in one bounded tool round", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    const toolContent = {
      role: "model",
      parts: [
        { functionCall: { name: "recommend_movement", args: { preference: "mobility" } } },
        { functionCall: { name: "recommend_recipe", args: { preference: "zero_prep" } } },
      ],
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(geminiResponse({ candidates: [{ content: toolContent }] }))
      .mockResolvedValueOnce(
        geminiResponse({ candidates: [{ content: { role: "model", parts: [{ text: "Here are a couple of low-effort options." }] } }] }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const { out, res } = makeRes();
    await handler(
      {
        method: "POST",
        headers: { "x-forwarded-for": "10.20.0.3" },
        body: requestBody("Give me something gentle to move and something I don't have to cook."),
      } as any,
      res as any,
    );

    expect(out.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(out.body.recommendations).toEqual([
      { kind: "movement", id: "17" },
      { kind: "movement", id: "18" },
      { kind: "movement", id: "19" },
      { kind: "recipe", id: "11" },
      { kind: "recipe", id: "12" },
      { kind: "recipe", id: "14" },
    ]);

    const synthesisBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    const responses = synthesisBody.contents.at(-1).parts.map((part: any) => part.functionResponse);
    expect(responses.map((response: any) => response.name)).toEqual([
      "recommend_movement",
      "recommend_recipe",
    ]);
  });

  it("does not guess catalogue intensity if a tool call arrives without a fatigue band", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        geminiResponse({
          candidates: [
            {
              content: {
                role: "model",
                parts: [{ functionCall: { name: "recommend_movement", args: { preference: "walking" } } }],
              },
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        geminiResponse({ candidates: [{ content: { role: "model", parts: [{ text: "Set your fatigue score first and I can match something." }] } }] }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const { out, res } = makeRes();
    await handler(
      {
        method: "POST",
        headers: { "x-forwarded-for": "10.20.0.4" },
        body: requestBody("What walk should I do?", null),
      } as any,
      res as any,
    );

    expect(out.status).toBe(200);
    expect(out.body.recommendations).toBeUndefined();
    const synthesisBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(synthesisBody.contents.at(-1).parts[0].functionResponse.response).toMatchObject({
      status: "needs_fatigue_score",
      items: [],
    });
  });
});
