import { afterEach, describe, expect, it, vi } from "vitest";
import handler, { executeBoundedRecommendationCalls } from "../api/gemini";

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

describe("ATHENA bounded recommendation execution", () => {
  it("flags the round when every requested recommendation execution fails", () => {
    const result = executeBoundedRecommendationCalls(
      [
        { id: "call_move", name: "recommend_movement", args: { count: 1 } },
        { id: "call_food", name: "recommend_recipe", args: { count: 1 } },
      ],
      "🟢 Green",
      (() => {
        throw new Error("catalogue unavailable");
      }) as any,
    );

    expect(result.allRecommendationExecutionsFailed).toBe(true);
    expect(result.recommendationRefs).toEqual([]);
    expect(
      result.functionResponseParts.map((part: any) => part.functionResponse.response.status),
    ).toEqual(["error", "error"]);
  });

  it("preserves a genuine partial success when the other recommendation execution fails", () => {
    const executeTool = vi.fn((name: unknown) => {
      if (name === "recommend_movement") {
        throw new Error("movement catalogue unavailable");
      }

      return {
        response: {
          status: "ok",
          kind: "recipe",
          items: [{ id: "3", title: "Zucchini & Feta Muffins" }],
        },
        refs: [{ kind: "recipe", id: "3" }],
      };
    }) as any;

    const result = executeBoundedRecommendationCalls(
      [
        { id: "call_move", name: "recommend_movement", args: { count: 1 } },
        { id: "call_food", name: "recommend_recipe", args: { count: 1 } },
      ],
      "🟢 Green",
      executeTool,
    );

    expect(result.allRecommendationExecutionsFailed).toBe(false);
    expect(result.recommendationRefs).toEqual([{ kind: "recipe", id: "3" }]);
    expect(
      result.functionResponseParts.map((part: any) => part.functionResponse.response.status),
    ).toEqual(["error", "ok"]);
  });

  it("does not treat a valid no-result recommendation outcome as an execution failure", () => {
    const result = executeBoundedRecommendationCalls(
      [{ id: "call_move", name: "recommend_movement", args: { count: 1 } }],
      null,
    );

    expect(result.allRecommendationExecutionsFailed).toBe(false);
    expect(result.recommendationRefs).toEqual([]);
    expect(
      (result.functionResponseParts[0] as any).functionResponse.response.status,
    ).toBe("needs_fatigue_score");
  });
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
    expect(declarations[0].parameters.properties.count.type).toBe("INTEGER");
    expect(declarations[1].parameters.properties.count.type).toBe("INTEGER");
    expect(forwarded.systemInstruction.parts[0].text).toContain(
      "Never claim a specific item is \"in the app\" unless the tool returned it",
    );
    expect(forwarded.systemInstruction.parts[0].text).toContain(
      'For a generic request such as "recommend an exercise", use preference "any"',
    );
    expect(forwarded.systemInstruction.parts[0].text).toContain(
      "Do not silently downgrade a Green or Yellow user",
    );
  });

  it("executes a movement tool against the current fatigue band and preserves its call ID", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    const toolContent = {
      role: "model",
      parts: [
        {
          functionCall: {
            id: "call_seated_red",
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
    expect(functionResponse.id).toBe("call_seated_red");
    expect(functionResponse.name).toBe("recommend_movement");
    expect(functionResponse.response).toMatchObject({
      status: "ok",
      zone: "Red",
      preference: "seated",
      preferenceMatched: true,
    });
    expect(functionResponse.response.items.map((item: any) => item.id)).toEqual(["16", "17", "18"]);
  });

  it("uses the Green catalogue baseline for a generic exercise recommendation", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    const toolContent = {
      role: "model",
      parts: [
        {
          functionCall: {
            id: "call_green_any",
            name: "recommend_movement",
            args: { preference: "any" },
          },
        },
      ],
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(geminiResponse({ candidates: [{ content: toolContent }] }))
      .mockResolvedValueOnce(
        geminiResponse({ candidates: [{ content: { role: "model", parts: [{ text: "A brisk walk is one of the Green options in the app." }] } }] }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const { out, res } = makeRes();
    await handler(
      {
        method: "POST",
        headers: { "x-forwarded-for": "10.20.0.20" },
        body: requestBody("Recommend an exercise for me", "🟢 Green"),
      } as any,
      res as any,
    );

    expect(out.status).toBe(200);
    expect(out.body.recommendations).toEqual([
      { kind: "movement", id: "1" },
      { kind: "movement", id: "2" },
      { kind: "movement", id: "3" },
    ]);
    const synthesisBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    const response = synthesisBody.contents.at(-1).parts[0].functionResponse;
    expect(response.id).toBe("call_green_any");
    expect(response.response).toMatchObject({
      status: "ok",
      zone: "Green",
      preference: "any",
      preferenceMatched: true,
    });
    expect(response.response.items.map((item: any) => item.title)).toEqual([
      "Brisk Walking",
      "Seated Leg Extensions",
      "Wall Squat Holds",
    ]);
  });

  it("can execute movement and recipe recommendations in one bounded tool round", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    const toolContent = {
      role: "model",
      parts: [
        { functionCall: { id: "call_move", name: "recommend_movement", args: { preference: "any", count: 1 } } },
        { functionCall: { id: "call_food", name: "recommend_recipe", args: { preference: "any", count: 1 } } },
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
        body: requestBody("Give me one exercise and one recipe.", "🟢 Green"),
      } as any,
      res as any,
    );

    expect(out.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(out.body.recommendations).toEqual([
      { kind: "movement", id: "1" },
      { kind: "recipe", id: "3" },
    ]);

    const synthesisBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    const responses = synthesisBody.contents.at(-1).parts.map((part: any) => part.functionResponse);
    expect(responses.map((response: any) => [response.id, response.name])).toEqual([
      ["call_move", "recommend_movement"],
      ["call_food", "recommend_recipe"],
    ]);
  });

  it("preserves function-call correlation while skipping duplicate same-domain operations", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    const toolContent = {
      role: "model",
      parts: [
        { functionCall: { id: "call_walk", name: "recommend_movement", args: { preference: "walking" } } },
        { functionCall: { id: "call_strength", name: "recommend_movement", args: { preference: "strength" } } },
      ],
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(geminiResponse({ candidates: [{ content: toolContent }] }))
      .mockResolvedValueOnce(
        geminiResponse({ candidates: [{ content: { role: "model", parts: [{ text: "Here are walking and strength options." }] } }] }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const { out, res } = makeRes();
    await handler(
      {
        method: "POST",
        headers: { "x-forwarded-for": "10.20.0.21" },
        body: requestBody("Give me a walking option and a strength option", "🟢 Green"),
      } as any,
      res as any,
    );

    expect(out.status).toBe(200);
    expect(out.body.recommendations).toEqual([
      { kind: "movement", id: "1" },
    ]);

    const synthesisBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    const responses = synthesisBody.contents.at(-1).parts.map((part: any) => part.functionResponse);
    expect(responses.map((response: any) => response.id)).toEqual(["call_walk", "call_strength"]);
    expect(responses.map((response: any) => response.name)).toEqual([
      "recommend_movement",
      "recommend_movement",
    ]);
    expect(responses[0].response.preference).toBe("walking");
    expect(responses[1].response).toMatchObject({
      status: "skipped",
      items: [],
    });
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
                parts: [{ functionCall: { id: "call_no_band", name: "recommend_movement", args: { preference: "walking" } } }],
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
    expect(synthesisBody.contents.at(-1).parts[0].functionResponse).toMatchObject({
      id: "call_no_band",
      response: {
        status: "needs_fatigue_score",
        items: [],
      },
    });
  });
});
