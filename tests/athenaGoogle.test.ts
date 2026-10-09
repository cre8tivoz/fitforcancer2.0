import { describe, expect, it, vi } from "vitest";
import { buildAthenaSynthesisMessages, generateAthenaRecovery, streamAthenaSelection } from "../api/_lib/athenaGoogle";

const response = (text: string) => new Response(JSON.stringify({
  candidates: [{ content: { role: "model", parts: [{ text }] }, finishReason: "STOP" }],
}), { status: 200, headers: { "Content-Type": "application/json" } });

describe("ATHENA direct Google SDK adapter", () => {
  it("uses direct Google Generate Content with fixed model, generation settings, and tool descriptors", async () => {
    let capturedUrl = "";
    let capturedHeaders: Headers | undefined;
    let capturedBody: Record<string, any> | undefined;
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      capturedUrl = String(input);
      capturedHeaders = new Headers(init?.headers);
      capturedBody = JSON.parse(String(init?.body));
      return response("Synthetic answer");
    });

    const result = await generateAthenaRecovery({
      apiKey: "test-only-key",
      system: "Synthetic instruction",
      history: [{ role: "user", content: "Synthetic question" }],
      signal: new AbortController().signal,
      fetchImpl: fetchMock as typeof fetch,
    });

    expect(result.text).toBe("Synthetic answer");
    expect(capturedUrl).toContain("generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent");
    expect(capturedHeaders?.get("x-goog-api-key")).toBe("test-only-key");
    expect(capturedBody?.systemInstruction.parts[0].text).toBe("Synthetic instruction");
    expect(capturedBody?.contents).toEqual([{ role: "user", parts: [{ text: "Synthetic question" }] }]);
    expect(capturedBody?.generationConfig).toMatchObject({
      temperature: 0.7,
      maxOutputTokens: 512,
      thinkingConfig: { thinkingBudget: 0 },
    });
    const declarations = capturedBody?.tools?.[0]?.functionDeclarations;
    expect(declarations.map((tool: { name: string }) => tool.name)).toEqual([
      "recommend_movement",
      "recommend_recipe",
    ]);
    expect(declarations[0].parametersJsonSchema.type).toBe("object");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it.each([
    ["malformed JSON followed by STOP", ["data: {not-json}\n\n", `data: ${JSON.stringify({ candidates: [{ content: { role: "model", parts: [{ text: "later" }] }, finishReason: "STOP" }] })}\n\n`].join("")],
    ["truncated stream without finish reason", `data: ${JSON.stringify({ candidates: [{ content: { role: "model", parts: [{ text: "partial" }] } }] })}\n\n`],
    ["data after terminal STOP", [`data: ${JSON.stringify({ candidates: [{ content: { role: "model", parts: [{ text: "complete" }] }, finishReason: "STOP" }] })}\n\n`, `data: ${JSON.stringify({ candidates: [{ content: { role: "model", parts: [{ text: "late" }] } }] })}\n\n`].join("")],
  ])("fails closed on %s", async (_label, streamBody) => {
    const encoder = new TextEncoder();
    const fetchMock = vi.fn(async () => new Response(encoder.encode(streamBody), {
      status: 200,
      headers: { "Content-Type": "text/event-stream" },
    }));
    const result = streamAthenaSelection({
      apiKey: "test-only-key",
      system: "Synthetic instruction",
      history: [{ role: "user", content: "Synthetic question" }],
      signal: new AbortController().signal,
      fetchImpl: fetchMock as typeof fetch,
    });
    await expect(async () => {
      for await (const _part of result.stream) { /* consume to terminal integrity check */ }
    }).rejects.toThrow();
  });

  it("keeps original history and the selected or recovered assistant tool call in synthesis context", () => {
    const history = [{ role: "user" as const, content: "Earlier synthetic question" }, { role: "model" as const, content: "Earlier answer" }];
    const recoveredMessages = [{
      role: "assistant" as const,
      content: [{ type: "tool-call" as const, toolCallId: "call-recovered", toolName: "recommend_recipe", input: { count: 1 } }],
    }];
    const messages = buildAthenaSynthesisMessages(history, recoveredMessages, [
      { toolCallId: "call-recovered", toolName: "recommend_recipe", input: { count: 1 } },
    ], [{ status: "ok" }]);

    expect(messages.slice(0, 2)).toEqual([
      { role: "user", content: "Earlier synthetic question" },
      { role: "assistant", content: "Earlier answer" },
    ]);
    expect(messages[2]).toEqual(recoveredMessages[0]);
    expect(messages[3]).toMatchObject({ role: "tool", content: [{ toolCallId: "call-recovered", toolName: "recommend_recipe" }] });
  });

});
