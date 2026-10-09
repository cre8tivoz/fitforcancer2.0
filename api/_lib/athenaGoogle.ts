import { generateText, jsonSchema, streamText, tool, type ModelMessage } from "ai";
import { createGoogle } from "@ai-sdk/google";
import { ATHENA_GENERATION_SETTINGS, ATHENA_GOOGLE_OPTIONS, ATHENA_MODEL } from "./athenaConfig.js";
import { ATHENA_RECOMMENDATION_TOOL_DECLARATIONS } from "../../utils/athenaRecommendations.js";

export type AthenaHistoryMessage = { role: "user" | "model"; content: string };
export type AthenaGoogleToolCall = { toolCallId: string; toolName: string; input: unknown };

const strictGeminiStreamFetch = (baseFetch: typeof fetch): typeof fetch => async (input, init) => {
  const response = await baseFetch(input, init);
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  if (!response.ok || !response.body || !url.includes(":streamGenerateContent")) return response;

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let failed = false;
  let terminal = false;
  let finishReason: string | null = null;
  const validateBlock = (block: string) => {
    const data = block.split("\n").filter((line) => line.startsWith("data:")).map((line) => line.slice(5).trimStart()).join("\n");
    if (!data || terminal) { failed = true; return; }
    let payload: any;
    try { payload = JSON.parse(data); } catch { failed = true; return; }
    const candidate = payload?.candidates?.[0];
    const parts = candidate?.content?.parts;
    const hasPart = Array.isArray(parts) && parts.some((part: any) =>
      (typeof part?.text === "string" && part.text.length > 0) ||
      (typeof part?.functionCall?.name === "string" && part.functionCall.name.length > 0));
    const reason = candidate?.finishReason;
    if (!Array.isArray(payload?.candidates) || !candidate || (!hasPart && !(typeof reason === "string" && reason.length > 0))) {
      failed = true;
      return;
    }
    if (typeof reason === "string" && reason.length > 0) {
      terminal = true;
      finishReason = reason;
    }
  };

  const guardedBody = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { value, done } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        buffer = buffer.replace(/\r\n/g, "\n");
        let boundary = buffer.indexOf("\n\n");
        while (boundary >= 0) {
          const block = buffer.slice(0, boundary).trim();
          buffer = buffer.slice(boundary + 2);
          if (block) validateBlock(block);
          boundary = buffer.indexOf("\n\n");
        }
        if (done) {
          if (buffer.trim()) validateBlock(buffer.trim());
          if (failed || finishReason !== "STOP") throw new Error("Invalid Gemini streaming response");
          controller.close();
          return;
        }
        if (failed) throw new Error("Invalid Gemini streaming response");
        controller.enqueue(value);
      } catch (error) {
        controller.error(error);
      }
    },
    cancel(reason) { return reader.cancel(reason); },
  });
  return new Response(guardedBody, { status: response.status, statusText: response.statusText, headers: response.headers });
};

const providerFor = (apiKey: string, fetchImpl?: typeof fetch) =>
  createGoogle({ apiKey, fetch: strictGeminiStreamFetch(fetchImpl ?? fetch) });

const toJsonSchema = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(toJsonSchema);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).map(([key, child]) => [
    key === "type" && typeof child === "string" ? "type" : key,
    key === "type" && typeof child === "string" ? child.toLowerCase() : toJsonSchema(child),
  ]));
};

const sdkTools = () => Object.fromEntries(
  ATHENA_RECOMMENDATION_TOOL_DECLARATIONS.map((descriptor) => [descriptor.name, tool({
    description: descriptor.description,
    inputSchema: jsonSchema(toJsonSchema(descriptor.parameters) as Parameters<typeof jsonSchema>[0]),
  })]),
);

export const toAthenaModelMessages = (history: AthenaHistoryMessage[]): ModelMessage[] =>
  history.map((message) => ({
    role: message.role === "model" ? "assistant" : "user",
    content: message.content,
  }));

const commonOptions = (apiKey: string, fetchImpl?: typeof fetch) => ({
  model: providerFor(apiKey, fetchImpl)(ATHENA_MODEL),
  temperature: ATHENA_GENERATION_SETTINGS.temperature,
  maxOutputTokens: ATHENA_GENERATION_SETTINGS.maxOutputTokens,
  providerOptions: { google: ATHENA_GOOGLE_OPTIONS },
  maxRetries: 0,
});

export const streamAthenaSelection = (input: {
  apiKey: string;
  system: string;
  history: AthenaHistoryMessage[];
  signal: AbortSignal;
  fetchImpl?: typeof fetch;
}) => streamText({
  ...commonOptions(input.apiKey, input.fetchImpl),
  system: input.system,
  messages: toAthenaModelMessages(input.history),
  tools: sdkTools(),
  abortSignal: input.signal,
  streamRetries: 0,
});

export const generateAthenaRecovery = async (input: {
  apiKey: string;
  system: string;
  history: AthenaHistoryMessage[];
  signal: AbortSignal;
  fetchImpl?: typeof fetch;
}) => generateText({
  ...commonOptions(input.apiKey, input.fetchImpl),
  system: input.system,
  messages: toAthenaModelMessages(input.history),
  tools: sdkTools(),
  abortSignal: input.signal,
});

export const streamAthenaSynthesis = (input: {
  apiKey: string;
  system: string;
  messages: ModelMessage[];
  signal: AbortSignal;
  fetchImpl?: typeof fetch;
}) => streamText({
  ...commonOptions(input.apiKey, input.fetchImpl),
  system: input.system,
  messages: input.messages,
  toolChoice: "none",
  tools: sdkTools(),
  abortSignal: input.signal,
  streamRetries: 0,
});

export const makeToolResultMessage = (
  calls: AthenaGoogleToolCall[],
  results: Record<string, unknown>[],
): ModelMessage => ({
  role: "tool",
  content: calls.map((call, index) => ({
    type: "tool-result" as const,
    toolCallId: call.toolCallId,
    toolName: call.toolName,
    output: { type: "json" as const, value: results[index] ?? {} },
  })) as ModelMessage extends { role: "tool"; content: infer C } ? C : never,
});

export const generateAthenaSynthesis = async (input: {
  apiKey: string;
  system: string;
  messages: ModelMessage[];
  signal: AbortSignal;
  fetchImpl?: typeof fetch;
}) => generateText({
  ...commonOptions(input.apiKey, input.fetchImpl),
  system: input.system,
  messages: input.messages,
  toolChoice: "none",
  tools: sdkTools(),
  abortSignal: input.signal,
});

export const buildAthenaSynthesisMessages = (
  history: AthenaHistoryMessage[],
  responseMessages: ModelMessage[],
  calls: AthenaGoogleToolCall[],
  results: Record<string, unknown>[],
): ModelMessage[] => [
  ...toAthenaModelMessages(history),
  ...responseMessages,
  makeToolResultMessage(calls, results),
];
