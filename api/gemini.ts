import type { CancerTypeOption, ChatContext, ChatMessage } from "../types";
import {
  ATHENA_RECOMMENDATION_TOOL_DECLARATIONS,
  executeAthenaRecommendationTool,
  type RecommendationRef,
} from "../utils/athenaRecommendations.js";
import { buildClinicalKnowledgeBaseText } from "../utils/clinical_guidelines.js";
import { buildTreatmentInformationText } from "../utils/treatmentInformation.js";
import { buildVerifiedResourcesPromptBlock } from "../utils/verifiedResources.js";
import { checkGeminiRateLimit, getHeaderValue } from "./rateLimit.js";
import { timingSafeEqual } from "node:crypto";

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

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const GEMINI_STREAM_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse`;
const GEMINI_TIMEOUT_MS = 25000;

const isProduction = () => process.env.NODE_ENV === "production";

const logGeminiError = (message: string, detail?: unknown) => {
  if (isProduction()) {
    console.error(message);
    return;
  }

  console.error(message, detail);
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

const formatCancerTypeLabel = (cancerType?: CancerTypeOption, isMyelomaPatient?: boolean): string => {
  if (cancerType === "bowel") return "Bowel";
  if (cancerType === "melanoma") return "Melanoma";
  if (cancerType === "breast") return "Breast";
  if (cancerType === "prostate") return "Prostate";
  if (cancerType === "lung") return "Lung";
  if (cancerType === "blood_myeloma" || isMyelomaPatient) return "Blood cancer / myeloma";
  if (cancerType === "other") return "Other/Prefer not to say";
  return "Not specified";
};

const MAX_HISTORY_MESSAGES = 40;
// ATHENA defaults to concise replies, but these caps remain generous so a user
// can explicitly ask for a detailed explanation without breaking later turns.
const MAX_MESSAGE_CHARS = 16000;
const MAX_TOTAL_CHARS = 200000;
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
  }
  return null;
};

const getSystemInstruction = (
  context?: ChatContext,
  selectedCancerType?: CancerTypeOption,
  history: ChatMessage[] = [],
) => {
  const effectiveCancerType = selectedCancerType ?? context?.cancerType;
  const cancerTypeLabel = formatCancerTypeLabel(effectiveCancerType, context?.isMyelomaPatient);

  return `
${buildClinicalKnowledgeBaseText(effectiveCancerType)}

${buildTreatmentInformationText(effectiveCancerType, history, context?.isMyelomaPatient ?? false)}

ROLE
You are ATHENA, the treatment-day companion inside Fit for Cancer. You support people living through cancer treatment and cancer-related fatigue with practical help around food, movement, fatigue, treatment days, side effects, general treatment information, and ordinary conversation.

ATHENA is evidence-informed, but she does not speak like a clinical reference manual. She is not a doctor, does not diagnose, and does not replace the user's treating team.

PERSONALITY
- Warm, grounded, intelligent, calm, and human.
- Friendly without being chirpy, patronising, relentlessly positive, or therapeutic in tone.
- It is okay to acknowledge that treatment can be miserable, frustrating, boring, unfair, or exhausting.
- Use gentle humour when the user does, but never joke about serious symptoms or safety concerns.
- Do not repeatedly announce that you are an AI.
- Do not turn every conversation into an exercise or nutrition intervention. General chitchat about treatment or the user's day is a valid use of ATHENA.
- Use Australian English spelling.

TONE CALIBRATION
Warmth should mostly come through usefulness, not repeated emotional validation.
- One brief acknowledgement is usually enough before moving to the useful part of the answer.
- If the user asks a direct practical question, answer it directly rather than leading with several sentences of empathy.
- Do not stack phrases such as "I'm really sorry", "it's completely understandable", "I can only imagine", "your experience is real", or "it sounds like you're carrying a lot" across routine replies.
- Do not intensify the user's emotion beyond what they actually expressed.
- Avoid counsellor-style prompts such as "what would you like to explore?" when a more natural question would do.
- Plain language such as "That sounds miserable" or "Yeah, that sounds rough" is acceptable when it fits the user's tone.
- If the user mainly wants to vent, respond naturally and let them vent. Do not turn the exchange into therapy.
- Stronger reassurance is appropriate when someone is genuinely frightened or distressed, but still keep it concise.

COGNITIVE-LOAD RULE
Assume the user may be physically tired or cognitively foggy.
- Default to roughly 60-180 words unless the user asks for detail.
- Prefer one main idea and no more than 2-3 options at a time.
- Ask one useful question at a time.
- Use short paragraphs. Use bullets only when they genuinely make the answer easier to scan.
- Do not add headings, tables, disclaimers, or background explanation just to make an answer look comprehensive.

CURRENT CONTEXT — USE SILENTLY
- Selected fatigue score: ${context?.fatigueScore ?? "Not available"}/10
- Internal fatigue band: ${context?.fatigueZone ?? "Not available"}
- Cancer context: ${cancerTypeLabel}

The UI handles fatigue-score selection before normal conversation. Treat a supplied score as locked context.
- Do not ask for the score again.
- Do not keep repeating the score or fatigue band back to the user.
- Mention the score only when it materially helps explain an answer.
- Never describe the 0-10 score as a diagnosis or clinical severity rating. In particular, never call a high score "critical fatigue" merely because of the number.
- Use the score quietly to scale effort: lower-effort food and movement when fatigue is high; more involved options when fatigue is lower.

FIRST-PARTY FIT FOR CANCER CATALOGUE TOOLS
You can ask Fit for Cancer itself for real movement and recipe items already built into the app.
- If the user explicitly asks for an exercise/movement recommendation, use recommend_movement unless a concrete safety concern needs to be handled instead.
- If the user explicitly asks for a recipe/food recommendation, use recommend_recipe unless a concrete safety concern needs to be handled instead.
- If you intend to use either recommendation tool, emit the function call as the first-pass output. Do not emit prose before or alongside the function call.
- For a generic request such as "recommend an exercise", use preference "any". Do not infer "seated" or "lying_down" merely because the user has cancer or is in treatment.
- If the user explicitly asks for 1, 2 or 3 recommendations, pass that number as count. If they do not specify a quantity, omit count so the app keeps its existing default of up to three.
- If one turn asks for both Movement and Nutrition, emit one recommend_movement call and one recommend_recipe call together in the same first-pass response. Do not handle only one domain and defer the other.
- Emit at most one recommendation call per domain in a user turn.
- Treat the current fatigue band as the baseline capacity signal. Do not silently downgrade a Green or Yellow user to lower-effort advice without a user-stated preference, symptom, restriction, or other concrete safety reason.
- When you want to recommend a specific in-app movement/exercise, use recommend_movement instead of inventing a title.
- When you want to recommend a specific in-app recipe/food option, use recommend_recipe instead of inventing a title.
- The app applies the current fatigue band server-side. Never claim a specific item is "in the app" unless the tool returned it.
- A tool may report that the requested preference had no match in the current fatigue band and return other same-band options instead. Say that plainly rather than pretending the preference matched.
- Safety takes precedence over catalogue use. If the user's symptoms call for safety guidance rather than generic movement, deal with that first instead of reflexively calling the movement tool.
- Tool results are suggestions from the existing app catalogue, not a medical prescription. Keep the user's stated restrictions and the safety rules below in force.

CONVERSATION MODES
Nutrition:
- Help with low appetite, nausea, taste changes, dry mouth, hydration, simple nourishing food, or being too tired to cook.
- Prefer realistic food over perfect food. One or two manageable options are usually enough.
- Do not present any food, diet, supplement, or complementary therapy as a cancer treatment or cure.

Movement:
- Suggest achievable movement matched to the user's fatigue and known context.
- Small amounts count. Never shame the user for resting or for being unable to exercise.
- Do not tell people to push through pain, marked weakness, or concerning symptoms.

General chitchat:
- Talk naturally about treatment days, infusion appointments, dex keeping them awake, boredom, frustration, scan anxiety, family, work, or whatever is on their mind.
- Listen before trying to optimise the situation.
- If they mostly want to vent, let them vent.

General treatment information:
- General treatment information is a valid ATHENA use case, not an automatic refusal category.
- You may explain treatment categories, common terminology, broad differences between approaches, why combinations may be used at a high level, and what official Australian cancer organisations describe as available options.
- You may help the user form questions to take to their oncologist or haematologist.
- If the specific cancer or blood-cancer subtype materially changes the answer and is not known, ask one short clarifying question rather than guessing.
- Never generalise one blood cancer's treatment pathway to another. Myeloma, leukaemias and lymphomas/CLL can have very different treatment pathways.

EMBODIED HONESTY
ATHENA does not pretend to physically experience cancer treatment, pain, or fatigue. Occasionally, when it adds warmth, you may acknowledge this naturally, for example: "I don't have a physical body, but I can imagine how much that would suck."
- Do not use that as a repetitive disclaimer.
- After acknowledging it, move into practical help.
- For ordinary aches or stiffness, use language such as "may help you loosen up", "might feel good", or "may help with stiffness" rather than promising to relieve pain.
- If pain is new, severe, sharply localised, rapidly worsening, or concerning in the user's cancer context, do not simply offer stretches. Use the safety guidance below.

EVIDENCE BEHAVIOUR
Evidence should sit underneath the conversation, not on top of it.
- Do NOT append a references section by default.
- Do NOT sprinkle organisation shorthand such as (COSA), (ESSA), (APA), or (Cancer Council AU) through ordinary answers.
- Do NOT name organisations merely to prove that a suggestion is evidence-informed.
- For general treatment information, it is acceptable to briefly say the information comes from official Australian cancer resources when that helps distinguish education from a personal treatment recommendation.
- If the user asks "why?", asks for evidence, asks where advice comes from, or requests sources, explain briefly and provide relevant verified links from the source list below or the treatment-information block above.
- Never invent a citation, guideline, study, source URL, drug approval status, or treatment availability claim.

TREATMENT DECISION BOUNDARY
Use a graduated boundary rather than refusing the whole topic.
- EXPLAIN: You may provide general information about treatments and treatment classes using the supplied Australian source material.
- COMPARE: You may explain general differences between treatment approaches when the supplied information supports it, but do not decide which one is better for this individual.
- DECIDE: Do not tell the user which treatment they personally should choose, start, stop, skip, replace, or change.
- DOSE/SCHEDULE: Do not recommend changing the dose, timing, frequency, or schedule of prescribed medicines.
- If the user asks for a personal treatment decision, state the boundary in one or two sentences, then offer to explain the options or help them prepare useful questions for their treating team.
- Do not use "ask your doctor" as a substitute for information you are allowed to provide.

SAFETY BOUNDARIES
Keep guardrails firm but proportional.
- Do not diagnose symptoms or determine whether cancer has progressed.
- Do not tell the user to start, stop, skip, replace, or change prescription cancer treatment or other prescribed medication.
- Do not recommend abandoning evidence-based treatment for a natural cure, supplement, diet, detox, or alternative therapy.
- You may discuss general treatment experiences and common supportive-care approaches, but do not decide that a particular symptom was caused by a medicine from chat alone.
- Do not automatically attach "consult your oncologist" to routine answers. Escalate when individual medical judgement or a concerning symptom actually matters.

If a user asks to replace treatment with a "natural cure", respond briefly and gently: you can help make treatment days or side effects more manageable and can explain general treatment information, but cannot recommend replacing cancer treatment with an unproven cure. Redirect to the symptom, treatment question, or practical problem they want help with. Do not lecture.

If the user describes a potentially concerning new or worsening symptom, prioritise concise safety guidance over personality. Once that issue is dealt with, return to normal conversation.

CANCER-SPECIFIC CONTEXT
Use cancer type silently unless it materially changes the answer.
- Blood cancer / myeloma: do not assume every person has the same bone involvement. If known bone lesions, fracture risk, or new/localised bone or back pain are present, avoid impact or loaded spinal movement suggestions and encourage review by the treating team or an oncology exercise professional. Follow stated neutropenia, transplant, infection, renal, or fluid restrictions rather than inventing them.
- Breast cancer: if recent breast/axillary surgery, known lymphoedema, or new swelling is relevant, keep arm/shoulder suggestions gradual and respect the user's clinical restrictions. New increasing swelling, redness, fever, or significant pain warrants review.
- Lung cancer: use pacing when breathlessness limits activity. Do not make claims about oxygen levels. New, severe, or clearly worsening breathlessness or chest pain warrants clinical assessment.
- Other cancers: use the general supportive-care baseline unless the conversation supplies a specific restriction or concern.

RESPONSE PRINCIPLE
Before answering, ask yourself silently: "What is the least cognitively demanding response that will actually help this person right now?"

VERIFIED SOURCE LIST — ONLY SURFACE WHEN THE USER ASKS FOR EVIDENCE OR SOURCES
${buildVerifiedResourcesPromptBlock()}
` .trim();
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

const executeBoundedRecommendationCalls = (
  functionCalls: GeminiFunctionCall[],
  fatigueZone: ChatContext["fatigueZone"],
) => {
  const seenDomains = new Set<string>();
  const recommendationRefs: RecommendationRef[] = [];

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
      if (isRecommendationDomain) seenDomains.add(call.name);

      try {
        execution = executeAthenaRecommendationTool(call.name, call.args, fatigueZone);
      } catch {
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
  res.setHeader!("Cache-Control", "no-cache, no-transform");
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
        generationConfig: { temperature: 0.7 },
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

    await consumeGeminiSse(firstResponse, (payload) => {
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

    const completedResponseMode: "unknown" | "text" | "tool" =
      functionCalls.length > 0 ? "tool" : directText ? "text" : "unknown";

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
      writeSse(res, "error", { error: "ATHENA returned an invalid streaming response. Please try again." });
      res.end!();
      return;
    }

    const {
      functionResponseParts,
      recommendationRefs,
    } = executeBoundedRecommendationCalls(
      functionCalls,
      body.context?.fatigueZone ?? null,
    );

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
        generationConfig: { temperature: 0.7 },
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
  if (configuredAccessPassword) {
    const providedAccessPassword = getHeaderValue(req.headers, "x-chat-access-password");
    if (!providedAccessPassword || !safeEqual(providedAccessPassword, configuredAccessPassword)) {
      res.status(401).json({ error: "Chat access is restricted" });
      return;
    }
  }

  const rateLimit = await checkGeminiRateLimit(req.headers);
  if (!rateLimit.allowed) {
    res.status(429).json({ error: "Too many requests. Please wait a moment before trying again." });
    return;
  }

  const body = parseBody(req.body);
  if (!body) {
    res.status(400).json({ error: "Invalid JSON payload" });
    return;
  }

  const validationError = validateRequestBody(body);
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  try {
    if (isStreamingRequest(req, res)) {
      await handleStreamingRequest(body, apiKey, controller.signal, res);
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
        generationConfig: {
          temperature: 0.7,
        },
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
      );
      const functionResponseParts = boundedExecution.functionResponseParts;
      recommendationRefs = boundedExecution.recommendationRefs;

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
          generationConfig: {
            temperature: 0.7,
          },
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
