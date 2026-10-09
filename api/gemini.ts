import type { CancerTypeOption, ChatContext, ChatMessage } from "../types";
import {
  ATHENA_RECOMMENDATION_TOOL_DECLARATIONS,
  executeAthenaRecommendationTool,
  type RecommendationRef,
} from "../utils/athenaRecommendations.js";
import { getFatigueZone } from "../utils/fatigueScore.js";
import { checkGeminiRateLimit, getHeaderValue } from "./rateLimit.js";
import { randomUUID, timingSafeEqual } from "node:crypto";
import { getSystemInstruction } from "./_lib/athenaPrompt.js";
import { ATHENA_MODEL, ATHENA_TIMEOUT_MS, getAthenaTransport } from "./_lib/athenaConfig.js";
import { safeAthenaMetadata } from "./_lib/athenaPrivacy.js";
import { buildAthenaSynthesisMessages, generateAthenaRecovery, generateAthenaSynthesis, streamAthenaSelection, streamAthenaSynthesis } from "./_lib/athenaGoogle.js";

const safeEqual = (a: string, b: string): boolean => {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
};

interface GeminiRequestBody {
  history?: ChatMessage[];
  context?: ChatContext;
  cancerType?: CancerTypeOption;
}

interface JsonResponse {
  error?: string;
  text?: string;
  recommendations?: RecommendationRef[];
}

interface VercelLikeRequest {
  method?: string;
  body?: GeminiRequestBody | string;
  headers?: Record<string, string | string[] | undefined>;
}

interface VercelLikeResponse {
  status: (code: number) => {
    json: (body: JsonResponse) => void;
  };
  setHeader?: (name: string, value: string) => void;
  write?: (chunk: string) => unknown;
  end?: (chunk?: string) => void;
  flushHeaders?: () => void;
}

interface UpstreamResult {
  ok: boolean;
  status: number;
  json: any | null;
  rawText: string;
}

interface GeminiFunctionCall {
  id?: string;
  name: string;
  args?: Record<string, unknown>;
}

const GEMINI_MODEL = ATHENA_MODEL;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const GEMINI_STREAM_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse`;
const GEMINI_TIMEOUT_MS = ATHENA_TIMEOUT_MS;

const logGeminiError = (message: string, _detail?: unknown) => {
  // Provider payloads and errors can contain health context. Keep app logs metadata-only.
  console.error(message);
};

const parseGeminiJson = (responseText: string): any | null => {
  if (!responseText) return null;

  try {
    return JSON.parse(responseText);
  } catch {
    return null;
  }
};

const callGemini = async (
  payload: Record<string, unknown>,
  apiKey: string,
  signal: AbortSignal,
): Promise<UpstreamResult> => {
  const response = await fetch(GEMINI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify(payload),
    signal,
  });

  const rawText = await response.text();
  return {
    ok: response.ok,
    status: response.status,
    json: parseGeminiJson(rawText),
    rawText,
  };
};

const openGeminiStream = (
  payload: Record<string, unknown>,
  apiKey: string,
  signal: AbortSignal,
) =>
  fetch(GEMINI_STREAM_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify(payload),
    signal,
  });


const MAX_HISTORY_MESSAGES = 32;
// Keep enough prior context for a normal conversation without allowing a
// public endpoint to forward an unbounded amount of health-related text.
const MAX_MESSAGE_CHARS = 8000;
const MAX_TOTAL_CHARS = 60000;
const MAX_OUTPUT_TOKENS = 512;
// Gemini's token cap covers both thinking and visible output. ATHENA's prompt
// calls for concise replies, so disable hidden reasoning on every request to
// avoid turning an otherwise complete streamed reply into MAX_TOKENS.
const GEMINI_GENERATION_CONFIG = {
  temperature: 0.7,
  maxOutputTokens: MAX_OUTPUT_TOKENS,
  thinkingConfig: { thinkingBudget: 0 },
};
const VALID_ROLES = new Set(["user", "model"]);
const VALID_CANCER_TYPES = new Set(["bowel", "melanoma", "breast", "prostate", "lung", "blood_myeloma", "other"]);

const validateRequestBody = (body: GeminiRequestBody): string | null => {
  if (!Array.isArray(body.history) || body.history.length === 0) {
    return "Request history is required";
  }
  if (body.history.length > MAX_HISTORY_MESSAGES) {
    return "Request history is too long";
  }
  for (const msg of body.history) {
    if (!msg || !VALID_ROLES.has(msg.role) || typeof msg.content !== "string" || msg.content.length < 1 || msg.content.length > MAX_MESSAGE_CHARS) {
      return "Request history contains an invalid message";
    }
  }
  const totalChars = body.history.reduce((sum, msg) => sum + msg.content.length, 0);
  if (totalChars > MAX_TOTAL_CHARS) {
    return "Request history is too large";
  }
  const cancerType = body.cancerType ?? body.context?.cancerType;
  if (cancerType !== undefined && cancerType !== null && !VALID_CANCER_TYPES.has(cancerType)) {
    return "Invalid cancer type";
  }
  if (body.context !== undefined && body.context !== null) {
    if (typeof body.context !== "object" || Array.isArray(body.context)) {
      return "Invalid context";
    }
    const { fatigueScore, fatigueZone, isMyelomaPatient, cancerType: ctxCancer } = body.context;
    if (fatigueScore !== null && fatigueScore !== undefined && (!Number.isInteger(fatigueScore) || fatigueScore < 0 || fatigueScore > 10)) {
      return "Invalid context";
    }
    if (fatigueZone !== null && fatigueZone !== undefined && (typeof fatigueZone !== "string" || fatigueZone.length > 20)) {
      return "Invalid context";
    }
    if (isMyelomaPatient !== undefined && typeof isMyelomaPatient !== "boolean") {
      return "Invalid context";
    }
    if (ctxCancer !== undefined && ctxCancer !== null && !VALID_CANCER_TYPES.has(ctxCancer)) {
      return "Invalid context";
    }
    if (body.cancerType && ctxCancer && body.cancerType !== ctxCancer) {
      return "Conflicting cancer context";
    }
  }
  return null;
};

// Do not let a caller choose a recommendation band independently of its
// numeric score. The client still sends the display value for compatibility,
// but the server is the authoritative boundary for all model and tool calls.
const normaliseRequestBody = (body: GeminiRequestBody): GeminiRequestBody => {
  if (!body.context) return body;

  const cancerType = body.cancerType ?? body.context.cancerType;
  const fatigueScore = body.context.fatigueScore;
  return {
    ...body,
    cancerType,
    context: {
      ...body.context,
      cancerType,
      fatigueZone: typeof fatigueScore === "number" ? getFatigueZone(fatigueScore) : null,
      // This client boolean is redundant with the selected cancer category.
      // Derive it here so it cannot be forged independently.
      isMyelomaPatient: cancerType === "blood_myeloma",
    },
  };
};

const parseBody = (body: VercelLikeRequest["body"]): GeminiRequestBody | null => {
  if (!body) {
    return null;
  }

  if (typeof body === "string") {
    try {
      return JSON.parse(body) as GeminiRequestBody;
    } catch {
      return null;
    }
  }

  return body;
};

const extractText = (payload: any): string | null => {
  const candidates = payload?.candidates;
  if (!Array.isArray(candidates)) {
    return null;
  }

  for (const candidate of candidates) {
    const parts = candidate?.content?.parts;
    if (!Array.isArray(parts)) {
      continue;
    }

    const text = parts
      .map((part: any) => (typeof part?.text === "string" ? part.text : ""))
      .join("")
      .trim();

    if (text) {
      return text;
    }
  }

  return null;
};

const extractTextChunk = (payload: any): string => {
  const parts = payload?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return "";
  return parts.map((part: any) => (typeof part?.text === "string" ? part.text : "")).join("");
};

const extractFunctionCalls = (payload: any): GeminiFunctionCall[] => {
  const parts = payload?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return [];

  return parts
    .map((part: any) => part?.functionCall)
    .filter((call: any) => call && typeof call.name === "string")
    .map((call: any) => ({
      ...(typeof call.id === "string" && call.id.length > 0 ? { id: call.id } : {}),
      name: call.name,
      args: call.args && typeof call.args === "object" && !Array.isArray(call.args) ? call.args : {},
    }));
};

const extractModelContent = (payload: any): Record<string, unknown> | null => {
  const content = payload?.candidates?.[0]?.content;
  return content && typeof content === "object" ? content : null;
};

const dedupeRecommendationRefs = (refs: RecommendationRef[]): RecommendationRef[] => {
  const seen = new Set<string>();
  return refs.filter((ref) => {
    const key = `${ref.kind}:${ref.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const collectPreviousRecommendationRefs = (history: ChatMessage[]): RecommendationRef[] => {
  const refs: RecommendationRef[] = [];

  for (const message of history) {
    if (message.role !== "model" || !Array.isArray(message.recommendations)) continue;

    for (const ref of message.recommendations) {
      if (
        ref &&
        (ref.kind === "movement" || ref.kind === "recipe") &&
        typeof ref.id === "string" &&
        ref.id.length > 0
      ) {
        refs.push({ kind: ref.kind, id: ref.id });
      }
    }
  }

  return dedupeRecommendationRefs(refs);
};

const summariseGeminiResponseShape = (payload: any) => {
  const candidates = Array.isArray(payload?.candidates) ? payload.candidates : [];
  const candidate = candidates[0];
  const parts = Array.isArray(candidate?.content?.parts) ? candidate.content.parts : [];

  return {
    candidateCount: candidates.length,
    finishReason:
      candidate?.finishReason === "STOP" || candidate?.finishReason === "MAX_TOKENS" || candidate?.finishReason === "SAFETY" || candidate?.finishReason === "RECITATION"
        ? candidate.finishReason
        : candidate?.finishReason
          ? "OTHER"
          : null,
    partCount: parts.length,
    partKinds: parts.map((part: any) => {
      if (part?.thought === true) return "thought";
      if (part?.functionCall && typeof part.functionCall.name === "string") return "functionCall";
      if (typeof part?.text === "string") return "text";
      return "other";
    }),
  };
};

export const executeBoundedRecommendationCalls = (
  functionCalls: GeminiFunctionCall[],
  fatigueZone: ChatContext["fatigueZone"],
  executeTool: typeof executeAthenaRecommendationTool = executeAthenaRecommendationTool,
  previousRecommendationRefs: RecommendationRef[] = [],
) => {
  const seenDomains = new Set<string>();
  const recommendationRefs: RecommendationRef[] = [];
  let attemptedRecommendationOperations = 0;
  let successfulRecommendationOperations = 0;
  let failedRecommendationOperations = 0;

  const functionResponseParts = functionCalls.map((call) => {
    const isRecommendationDomain =
      call.name === "recommend_movement" || call.name === "recommend_recipe";

    let execution: { response: Record<string, unknown>; refs: RecommendationRef[] };

    if (isRecommendationDomain && seenDomains.has(call.name)) {
      execution = {
        response: {
          status: "skipped",
          message: "Only one recommendation request per domain is allowed in a single ATHENA turn.",
          items: [],
        },
        refs: [],
      };
    } else {
      if (isRecommendationDomain) {
        seenDomains.add(call.name);
        attemptedRecommendationOperations += 1;
      }

      try {
        execution = executeTool(call.name, call.args, fatigueZone, previousRecommendationRefs);
        if (isRecommendationDomain) successfulRecommendationOperations += 1;
      } catch {
        if (isRecommendationDomain) failedRecommendationOperations += 1;
        execution = {
          response: {
            status: "error",
            message: "That recommendation could not be retrieved.",
            items: [],
          },
          refs: [],
        };
      }
    }

    recommendationRefs.push(...execution.refs);

    return {
      functionResponse: {
        ...(call.id ? { id: call.id } : {}),
        name: call.name,
        response: execution.response,
      },
    };
  });

  return {
    functionResponseParts,
    recommendationRefs: dedupeRecommendationRefs(recommendationRefs),
    allRecommendationExecutionsFailed:
      attemptedRecommendationOperations > 0 &&
      successfulRecommendationOperations === 0 &&
      failedRecommendationOperations === attemptedRecommendationOperations,
  };
};

const makeBaseContents = (history: ChatMessage[]) =>
  history.map((message) => ({
    role: message.role,
    parts: [{ text: message.content }],
  }));

const makeSystemInstruction = (body: GeminiRequestBody) => ({
  parts: [{ text: getSystemInstruction(body.context, body.cancerType, body.history) }],
});

const makeToolBlock = () => [
  {
    functionDeclarations: ATHENA_RECOMMENDATION_TOOL_DECLARATIONS,
  },
];

const isStreamingRequest = (req: VercelLikeRequest, res: VercelLikeResponse) =>
  (getHeaderValue(req.headers, "accept") || "").includes("text/event-stream") &&
  typeof res.setHeader === "function" &&
  typeof res.write === "function" &&
  typeof res.end === "function";

const startSse = (res: VercelLikeResponse) => {
  res.setHeader!("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader!("Cache-Control", "private, no-store");
  res.setHeader!("Connection", "keep-alive");
  res.setHeader!("X-Accel-Buffering", "no");
  res.flushHeaders?.();
};

const writeSse = (res: VercelLikeResponse, event: string, data: Record<string, unknown>) => {
  res.write!(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
};

const isRecordValue = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const isConsumableGeminiStreamPayload = (payload: unknown): boolean => {
  if (!isRecordValue(payload) || !Array.isArray(payload.candidates) || payload.candidates.length === 0) {
    return false;
  }

  const candidate = payload.candidates[0];
  if (!isRecordValue(candidate)) return false;

  const hasTerminalState =
    typeof candidate.finishReason === "string" && candidate.finishReason.length > 0;

  const content = candidate.content;
  const hasConsumablePart =
    isRecordValue(content) &&
    Array.isArray(content.parts) &&
    content.parts.some((part) => {
      if (!isRecordValue(part)) return false;
      if (typeof part.text === "string" && part.text.length > 0) return true;
      const functionCall = part.functionCall;
      return (
        isRecordValue(functionCall) &&
        typeof functionCall.name === "string" &&
        functionCall.name.length > 0
      );
    });

  return hasConsumablePart || hasTerminalState;
};

const consumeGeminiSse = async (
  response: Response,
  onPayload: (payload: any) => void,
): Promise<void> => {
  if (!response.body) throw new Error("Gemini streaming response had no body");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finishReason: string | null = null;
  let streamParseFailed = false;

  const handleBlock = (block: string) => {
    const data = block
      .split("\n")
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trimStart())
      .join("\n");
    if (!data) {
      streamParseFailed = true;
      return;
    }

    const parsed = parseGeminiJson(data);
    if (!isConsumableGeminiStreamPayload(parsed)) {
      streamParseFailed = true;
      return;
    }

    const candidateFinishReason = parsed.candidates[0].finishReason;
    if (typeof candidateFinishReason === "string" && candidateFinishReason.length > 0) {
      finishReason = candidateFinishReason;
    }
    onPayload(parsed);
  };

  while (true) {
    const { value, done } = await reader.read();
    buffer = (buffer + decoder.decode(value, { stream: !done })).replace(/\r\n/g, "\n");

    let boundary = buffer.indexOf("\n\n");
    while (boundary >= 0) {
      const block = buffer.slice(0, boundary).trim();
      buffer = buffer.slice(boundary + 2);
      if (block) handleBlock(block);
      boundary = buffer.indexOf("\n\n");
    }

    if (done) break;
  }

  const tail = buffer.trim();
  if (tail) handleBlock(tail);

  if (streamParseFailed) {
    throw new Error("Gemini streaming response contained malformed data");
  }

  if (finishReason !== "STOP") {
    throw new Error(
      finishReason
        ? `Gemini streaming response ended with finish reason ${finishReason}`
        : "Gemini streaming response ended without a finish reason",
    );
  }
};


type AthenaDiagnosticState = {
  requestId: string;
  startedAt: number;
  callCount: number;
  recoveryCount: number;
  inputTokens: number;
  outputTokens: number;
  finishReason: "stop" | "tool-calls" | "length" | "blocked" | "unknown" | "error";
  errorCategory?: "timeout" | "aborted" | "upstream" | "invalid-response" | "rate-limit" | "configuration";
};
const newAthenaDiagnostic = (): AthenaDiagnosticState => ({
  requestId: randomUUID().replaceAll("-", "").slice(0, 12),
  startedAt: Date.now(), callCount: 0, recoveryCount: 0, inputTokens: 0, outputTokens: 0, finishReason: "unknown",
});
const safeFinishReason = (reason: unknown): AthenaDiagnosticState["finishReason"] => {
  if (reason === "stop" || reason === "tool-calls" || reason === "length") return reason;
  if (reason === "content-filter" || reason === "blocked") return "blocked";
  if (reason === "error") return "error";
  return "unknown";
};
const addTokenUsage = async (state: AthenaDiagnosticState, result: { usage: { inputTokens?: number; outputTokens?: number } | PromiseLike<{ inputTokens?: number; outputTokens?: number }> }) => {
  try {
    const usage = await Promise.resolve(result.usage);
    if (typeof usage.inputTokens === "number") state.inputTokens += usage.inputTokens;
    if (typeof usage.outputTokens === "number") state.outputTokens += usage.outputTokens;
  } catch { /* usage is optional provider metadata */ }
};
const logAthenaDiagnostic = (state: AthenaDiagnosticState) => {
  console.info("[athena] generation", safeAthenaMetadata({
    requestId: state.requestId,
    model: ATHENA_MODEL,
    transport: "google-generate-content",
    callCount: state.callCount,
    recoveryCount: state.recoveryCount,
    durationMs: Date.now() - state.startedAt,
    finishReason: state.finishReason,
    inputTokens: state.inputTokens,
    outputTokens: state.outputTokens,
    ...(state.errorCategory ? { errorCategory: state.errorCategory } : {}),
  }));
};

const handleSdkJsonRequest = async (
  body: GeminiRequestBody,
  apiKey: string,
  signal: AbortSignal,
): Promise<JsonResponse> => {
  const diagnostics = newAthenaDiagnostic();
  try {
    const system = getSystemInstruction(body.context, body.cancerType, body.history);
    const history = body.history!.map(({ role, content }) => ({ role, content }));
    diagnostics.callCount += 1;
    const selection = await generateAthenaRecovery({ apiKey, system, history, signal });
    diagnostics.finishReason = safeFinishReason(selection.finishReason);
    await addTokenUsage(diagnostics, selection);
    if (selection.finishReason !== "stop" && !(selection.finishReason === "tool-calls" && selection.toolCalls.length > 0)) {
      return { error: "ATHENA returned an incomplete response. Please try again." };
    }
    if (selection.toolCalls.length === 0) {
      return selection.text.trim()
        ? { text: selection.text }
        : { error: "ATHENA returned an empty response. Please try again." };
    }
    const calls = sdkCallsFrom(selection.toolCalls);
    const execution = executeBoundedRecommendationCalls(
      calls,
      body.context?.fatigueZone ?? null,
      executeAthenaRecommendationTool,
      collectPreviousRecommendationRefs(body.history!),
    );
    if (execution.allRecommendationExecutionsFailed) {
      diagnostics.errorCategory = "upstream";
      return { error: "There was an error connecting to ATHENA. Please try again." };
    }
    const responseMessages = await selection.responseMessages;
    diagnostics.callCount += 1;
    const synthesis = await generateAthenaSynthesis({
      apiKey,
      system,
      messages: buildAthenaSynthesisMessages(
        history,
        responseMessages,
        selection.toolCalls,
        execution.functionResponseParts.map((part) => part.functionResponse.response),
      ),
      signal,
    });
    diagnostics.finishReason = safeFinishReason(synthesis.finishReason);
    await addTokenUsage(diagnostics, synthesis);
    if (synthesis.finishReason !== "stop" || !synthesis.text.trim()) {
      diagnostics.errorCategory = "invalid-response";
      return { error: "ATHENA returned an incomplete response. Please try again." };
    }
    return { text: synthesis.text, ...(execution.recommendationRefs.length ? { recommendations: execution.recommendationRefs } : {}) };
  } catch (error) {
    diagnostics.errorCategory = (error as Error)?.name === "AbortError" ? "timeout" : "upstream";
    throw error;
  } finally {
    logAthenaDiagnostic(diagnostics);
  }
};

const sdkCallsFrom = (calls: Array<{ toolCallId: string; toolName: string; input: unknown }>): GeminiFunctionCall[] =>
  calls.map((call) => ({ id: call.toolCallId, name: call.toolName, args: isRecordValue(call.input) ? call.input : {} }));

const handleSdkStreamingRequest = async (
  body: GeminiRequestBody,
  apiKey: string,
  signal: AbortSignal,
  res: VercelLikeResponse,
): Promise<void> => {
  let streamStarted = false;
  const diagnostics = newAthenaDiagnostic();
  try {
    const system = getSystemInstruction(body.context, body.cancerType, body.history);
    const history = body.history!.map(({ role, content }) => ({ role, content }));
    startSse(res);
    streamStarted = true;

    diagnostics.callCount += 1;
    const selection = streamAthenaSelection({ apiKey, system, history, signal });
    let directText = "";
    let finishReason: string | null = null;
    for await (const part of selection.stream) {
      if (part.type === "text-delta") {
        directText += part.text;
        writeSse(res, "delta", { text: part.text });
      } else if (part.type === "finish") {
        finishReason = part.finishReason;
        diagnostics.finishReason = safeFinishReason(part.finishReason);
      } else if (part.type === "error") {
        throw part.error;
      }
      // Reasoning, raw provider payloads, and partial tool arguments are never surfaced.
    }

    await addTokenUsage(diagnostics, selection);
    let toolCalls = await selection.toolCalls;
    let synthesisResponseMessages = await selection.responseMessages;
    if (finishReason !== "stop" && !(finishReason === "tool-calls" && toolCalls.length > 0)) {
      writeSse(res, "error", { error: "ATHENA returned an incomplete response. Please try again." });
      res.end!();
      return;
    }

    if (toolCalls.length === 0 && !directText.trim()) {
      if (finishReason !== "stop") {
        writeSse(res, "error", { error: "ATHENA returned an incomplete response. Please try again." });
        res.end!();
        return;
      }
      diagnostics.callCount += 1;
      diagnostics.recoveryCount += 1;
      const recovered = await generateAthenaRecovery({ apiKey, system, history, signal });
      diagnostics.finishReason = safeFinishReason(recovered.finishReason);
      await addTokenUsage(diagnostics, recovered);
      if (recovered.finishReason !== "stop" && !(recovered.finishReason === "tool-calls" && recovered.toolCalls.length > 0)) {
        writeSse(res, "error", { error: "ATHENA returned an incomplete response. Please try again." });
        res.end!();
        return;
      }
      toolCalls = recovered.toolCalls;
      if (toolCalls.length > 0) synthesisResponseMessages = await recovered.responseMessages;
      if (toolCalls.length === 0 && recovered.text.trim()) {
        directText = recovered.text;
        writeSse(res, "delta", { text: recovered.text });
      }
      if (toolCalls.length > 0 && directText) {
        directText = "";
        writeSse(res, "reset", {});
      }
    }

    if (toolCalls.length === 0) {
      if (!directText.trim()) writeSse(res, "error", { error: "ATHENA returned an empty response. Please try again." });
      else writeSse(res, "done", { recommendations: [] });
      res.end!();
      return;
    }

    if (directText) writeSse(res, "reset", {});
    const calls = sdkCallsFrom(toolCalls);
    const execution = executeBoundedRecommendationCalls(
      calls,
      body.context?.fatigueZone ?? null,
      executeAthenaRecommendationTool,
      collectPreviousRecommendationRefs(body.history!),
    );
    if (execution.allRecommendationExecutionsFailed) {
      writeSse(res, "error", { error: "There was an error connecting to ATHENA. Please try again." });
      res.end!();
      return;
    }

    const toolResults = execution.functionResponseParts.map((part) => part.functionResponse.response);
    diagnostics.callCount += 1;
    const synthesis = streamAthenaSynthesis({
      apiKey,
      system,
      messages: buildAthenaSynthesisMessages(history, synthesisResponseMessages, toolCalls, toolResults),
      signal,
    });
    let finalText = "";
    let synthesisFinish: string | null = null;
    for await (const part of synthesis.stream) {
      if (part.type === "text-delta") {
        finalText += part.text;
        writeSse(res, "delta", { text: part.text });
      } else if (part.type === "finish") {
        synthesisFinish = part.finishReason;
        diagnostics.finishReason = safeFinishReason(part.finishReason);
      } else if (part.type === "error") {
        throw part.error;
      }
    }
    await addTokenUsage(diagnostics, synthesis);
    if (synthesisFinish !== "stop" || !finalText.trim()) {
      diagnostics.errorCategory = "invalid-response";
      writeSse(res, "error", { error: "ATHENA returned an incomplete response. Please try again." });
    } else {
      writeSse(res, "done", { recommendations: execution.recommendationRefs });
    }
    res.end!();
  } catch (error) {
    diagnostics.errorCategory = (error as Error)?.name === "AbortError" ? "timeout" : "upstream";
    if (streamStarted) {
      writeSse(res, "error", { error: (error as Error)?.name === "AbortError"
        ? "ATHENA took too long to respond. Please try again."
        : "There was an error connecting to ATHENA. Please try again." });
      res.end!();
    } else {
      res.status(502).json({ error: "There was an error connecting to ATHENA. Please try again." });
    }
  } finally {
    logAthenaDiagnostic(diagnostics);
  }
};

const handleStreamingRequest = async (
  body: GeminiRequestBody,
  apiKey: string,
  signal: AbortSignal,
  res: VercelLikeResponse,
): Promise<void> => {
  let streamStarted = false;

  try {
    const systemInstruction = makeSystemInstruction(body);
    const baseContents = makeBaseContents(body.history!);
    const tools = makeToolBlock();
    const firstResponse = await openGeminiStream(
      {
        systemInstruction,
        contents: baseContents,
        tools,
        generationConfig: GEMINI_GENERATION_CONFIG,
      },
      apiKey,
      signal,
    );

    if (!firstResponse.ok) {
      const rawText = await firstResponse.text();
      logGeminiError(`[gemini] streaming upstream error status=${firstResponse.status}`, parseGeminiJson(rawText) ?? rawText);
      res.status(firstResponse.status).json({ error: "There was an error connecting to ATHENA. Please try again." });
      return;
    }

    startSse(res);
    streamStarted = true;

    let responseMode: "unknown" | "text" | "tool" = "unknown";
    let directText = "";
    const functionCalls: GeminiFunctionCall[] = [];
    const functionCallIds = new Set<string>();
    const modelParts: any[] = [];
    let selectionStreamShape: ReturnType<typeof summariseGeminiResponseShape> | null = null;
    let recoveryShape: ReturnType<typeof summariseGeminiResponseShape> | null = null;

    await consumeGeminiSse(firstResponse, (payload) => {
      selectionStreamShape = summariseGeminiResponseShape(payload);
      const calls = extractFunctionCalls(payload);
      const parts = payload?.candidates?.[0]?.content?.parts;

      if (Array.isArray(parts)) {
        let callIndex = 0;
        parts.forEach((part: any) => {
          if (!part?.functionCall) {
            modelParts.push(part);
            return;
          }

          const call = calls[callIndex++];
          if (!call) return;
          if (call.id && functionCallIds.has(call.id)) return;
          if (call.id) functionCallIds.add(call.id);
          functionCalls.push(call);
          modelParts.push(part);
        });
      }

      if (calls.length > 0) {
        if (responseMode !== "tool" && directText) {
          directText = "";
          writeSse(res, "reset", {});
        }
        responseMode = "tool";
        return;
      }

      const textChunk = extractTextChunk(payload);
      if (!textChunk) return;
      if (responseMode === "tool") return;

      responseMode = "text";
      directText += textChunk;
      writeSse(res, "delta", { text: textChunk });
    });

    let completedResponseMode: "unknown" | "text" | "tool" =
      functionCalls.length > 0 ? "tool" : directText.trim() ? "text" : "unknown";

    if (completedResponseMode === "unknown") {
      // Gemini can occasionally finish the streamed selection pass with STOP
      // without yielding consumable text or a complete function call. Recover
      // once with the equivalent unary request; this is not an agent loop.
      const retryResult = await callGemini(
        {
          systemInstruction,
          contents: baseContents,
          tools,
          generationConfig: GEMINI_GENERATION_CONFIG,
        },
        apiKey,
        signal,
      );

      recoveryShape = summariseGeminiResponseShape(retryResult.json);

      if (!retryResult.ok) {
        logGeminiError(
          `[gemini] unary selection retry error status=${retryResult.status}`,
          retryResult.json ?? retryResult.rawText,
        );
        writeSse(res, "error", { error: "There was an error connecting to ATHENA. Please try again." });
        res.end!();
        return;
      }

      const retryCandidate = retryResult.json?.candidates?.[0];
      const retryFinishReason = retryCandidate?.finishReason;
      if (retryFinishReason !== "STOP") {
        logGeminiError(
          `[gemini] unary selection retry ended with finish reason ${retryFinishReason ?? "missing"}`,
          retryResult.json,
        );
        writeSse(res, "error", { error: "ATHENA returned an incomplete response. Please try again." });
        res.end!();
        return;
      }

      const retryFunctionCalls = extractFunctionCalls(retryResult.json);
      if (retryFunctionCalls.length > 0) {
        const retryModelContent = extractModelContent(retryResult.json);
        const retryParts = retryModelContent?.parts;
        if (!Array.isArray(retryParts) || retryParts.length === 0) {
          writeSse(res, "error", { error: "ATHENA returned an invalid tool response. Please try again." });
          res.end!();
          return;
        }

        if (directText) {
          directText = "";
          writeSse(res, "reset", {});
        }
        functionCalls.splice(0, functionCalls.length, ...retryFunctionCalls);
        modelParts.splice(0, modelParts.length, ...retryParts);
        completedResponseMode = "tool";
      } else {
        const retryText = extractText(retryResult.json);
        if (retryText) {
          if (directText) {
            directText = "";
            writeSse(res, "reset", {});
          }
          directText = retryText;
          completedResponseMode = "text";
          writeSse(res, "delta", { text: retryText });
        }
      }
    }

    if (completedResponseMode === "text") {
      if (!directText.trim()) {
        writeSse(res, "error", { error: "ATHENA returned an empty response. Please try again." });
      } else {
        writeSse(res, "done", { recommendations: [] });
      }
      res.end!();
      return;
    }

    if (completedResponseMode !== "tool" || functionCalls.length === 0 || modelParts.length === 0) {
      console.warn("[gemini] selection recovery exhausted", {
        stream: selectionStreamShape,
        recovery: recoveryShape,
        functionCallCount: functionCalls.length,
        modelPartCount: modelParts.length,
      });
      writeSse(res, "error", { error: "ATHENA returned an invalid streaming response. Please try again." });
      res.end!();
      return;
    }

    const {
      functionResponseParts,
      recommendationRefs,
      allRecommendationExecutionsFailed,
    } = executeBoundedRecommendationCalls(
      functionCalls,
      body.context?.fatigueZone ?? null,
      executeAthenaRecommendationTool,
      collectPreviousRecommendationRefs(body.history!),
    );

    if (allRecommendationExecutionsFailed) {
      writeSse(res, "error", { error: "There was an error connecting to ATHENA. Please try again." });
      res.end!();
      return;
    }

    const finalResponse = await openGeminiStream(
      {
        systemInstruction,
        contents: [
          ...baseContents,
          { role: "model", parts: modelParts },
          { role: "user", parts: functionResponseParts },
        ],
        tools,
        toolConfig: {
          functionCallingConfig: {
            mode: "NONE",
          },
        },
        generationConfig: GEMINI_GENERATION_CONFIG,
      },
      apiKey,
      signal,
    );

    if (!finalResponse.ok) {
      const rawText = await finalResponse.text();
      logGeminiError(`[gemini] streaming tool synthesis error status=${finalResponse.status}`, parseGeminiJson(rawText) ?? rawText);
      writeSse(res, "error", { error: "There was an error connecting to ATHENA. Please try again." });
      res.end!();
      return;
    }

    let finalText = "";
    await consumeGeminiSse(finalResponse, (payload) => {
      const textChunk = extractTextChunk(payload);
      if (!textChunk) return;
      finalText += textChunk;
      writeSse(res, "delta", { text: textChunk });
    });

    if (!finalText.trim()) {
      writeSse(res, "error", { error: "ATHENA returned an empty response. Please try again." });
    } else {
      writeSse(res, "done", { recommendations: recommendationRefs });
    }
    res.end!();
  } catch (error) {
    const timedOut = (error as Error).name === "AbortError";
    if (streamStarted) {
      writeSse(res, "error", {
        error: timedOut
          ? "ATHENA took too long to respond. Please try again."
          : "There was an error connecting to ATHENA. Please try again.",
      });
      res.end!();
      return;
    }

    if (timedOut) {
      console.error("[gemini] streaming upstream request timed out");
      res.status(504).json({ error: "ATHENA took too long to respond. Please try again." });
      return;
    }

    logGeminiError("[gemini] streaming proxy error", error);
    res.status(502).json({ error: "There was an error connecting to ATHENA. Please try again." });
  }
};

export default async function handler(req: VercelLikeRequest, res: VercelLikeResponse): Promise<void> {
  res.setHeader?.("Cache-Control", "private, no-store");

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Server is missing GEMINI_API_KEY" });
    return;
  }

  const configuredAccessPassword = process.env.CHAT_ACCESS_PASSWORD || process.env.FFC_CHAT_ACCESS_PASSWORD;
  // Share the same IP limiter with the optional access gate so incorrect
  // password guesses cannot be made without a bounded cost.
  const rateLimit = await checkGeminiRateLimit(req.headers);
  if (!rateLimit.allowed) {
    res.status(429).json({ error: "Too many requests. Please wait a moment before trying again." });
    return;
  }

  if (configuredAccessPassword) {
    const providedAccessPassword = getHeaderValue(req.headers, "x-chat-access-password");
    if (!providedAccessPassword || !safeEqual(providedAccessPassword, configuredAccessPassword)) {
      res.status(401).json({ error: "Chat access is restricted" });
      return;
    }
  }

  let body = parseBody(req.body);
  if (!body) {
    res.status(400).json({ error: "Invalid JSON payload" });
    return;
  }

  const validationError = validateRequestBody(body);
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }
  body = normaliseRequestBody(body);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  try {
    if (isStreamingRequest(req, res)) {
      if (getAthenaTransport() === "sdk") {
        await handleSdkStreamingRequest(body, apiKey, controller.signal, res);
      } else {
        await handleStreamingRequest(body, apiKey, controller.signal, res);
      }
      return;
    }

    if (getAthenaTransport() === "sdk") {
      const result = await handleSdkJsonRequest(body, apiKey, controller.signal);
      if (result.error) {
        res.status(502).json({ error: result.error });
      } else {
        res.status(200).json(result);
      }
      return;
    }

    const systemInstruction = makeSystemInstruction(body);
    const baseContents = makeBaseContents(body.history!);
    const tools = makeToolBlock();

    const firstResult = await callGemini(
      {
        systemInstruction,
        contents: baseContents,
        tools,
        generationConfig: GEMINI_GENERATION_CONFIG,
      },
      apiKey,
      controller.signal,
    );

    if (!firstResult.ok) {
      logGeminiError(`[gemini] upstream error status=${firstResult.status}`, firstResult.json ?? firstResult.rawText);
      res.status(firstResult.status).json({
        error: "There was an error connecting to ATHENA. Please try again.",
      });
      return;
    }

    const functionCalls = extractFunctionCalls(firstResult.json);
    let finalPayload = firstResult.json;
    let recommendationRefs: RecommendationRef[] = [];

    if (functionCalls.length > 0) {
      const modelContent = extractModelContent(firstResult.json);
      if (!modelContent) {
        logGeminiError("[gemini] function call response had no model content", firstResult.json);
        res.status(502).json({ error: "ATHENA returned an invalid tool response. Please try again." });
        return;
      }

      const boundedExecution = executeBoundedRecommendationCalls(
        functionCalls,
        body.context?.fatigueZone ?? null,
        executeAthenaRecommendationTool,
        collectPreviousRecommendationRefs(body.history!),
      );
      const functionResponseParts = boundedExecution.functionResponseParts;
      recommendationRefs = boundedExecution.recommendationRefs;

      if (boundedExecution.allRecommendationExecutionsFailed) {
        res.status(502).json({
          error: "There was an error connecting to ATHENA. Please try again.",
        });
        return;
      }

      const finalResult = await callGemini(
        {
          systemInstruction,
          contents: [
            ...baseContents,
            modelContent,
            {
              role: "user",
              parts: functionResponseParts,
            },
          ],
          tools,
          toolConfig: {
            functionCallingConfig: {
              mode: "NONE",
            },
          },
          generationConfig: GEMINI_GENERATION_CONFIG,
        },
        apiKey,
        controller.signal,
      );

      if (!finalResult.ok) {
        logGeminiError(`[gemini] tool synthesis error status=${finalResult.status}`, finalResult.json ?? finalResult.rawText);
        res.status(finalResult.status).json({
          error: "There was an error connecting to ATHENA. Please try again.",
        });
        return;
      }

      finalPayload = finalResult.json;
    }

    const text = extractText(finalPayload);
    if (!text) {
      logGeminiError("[gemini] upstream returned no text", finalPayload);
      res.status(502).json({ error: "ATHENA returned an empty response. Please try again." });
      return;
    }

    res.status(200).json({
      text,
      ...(recommendationRefs.length > 0 ? { recommendations: recommendationRefs } : {}),
    });
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      console.error("[gemini] upstream request timed out");
      res.status(504).json({ error: "ATHENA took too long to respond. Please try again." });
      return;
    }

    logGeminiError("[gemini] proxy error", error);
    res.status(502).json({ error: "There was an error connecting to ATHENA. Please try again." });
  } finally {
    clearTimeout(timeoutId);
  }
}
