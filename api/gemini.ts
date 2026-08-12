import type { CancerTypeOption, ChatContext, ChatMessage } from "../types";
import { buildClinicalKnowledgeBaseText } from "../utils/clinical_guidelines.js";
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
}

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
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

const formatCancerTypeLabel = (cancerType?: CancerTypeOption, isMyelomaPatient?: boolean): string => {
  if (cancerType === "bowel") return "Bowel";
  if (cancerType === "melanoma") return "Melanoma";
  if (cancerType === "breast") return "Breast";
  if (cancerType === "prostate") return "Prostate";
  if (cancerType === "lung") return "Lung";
  if (cancerType === "blood_myeloma" || isMyelomaPatient) return "Blood/Myeloma";
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

const getSystemInstruction = (context?: ChatContext, selectedCancerType?: CancerTypeOption) => {
  const effectiveCancerType = selectedCancerType ?? context?.cancerType;
  const cancerTypeLabel = formatCancerTypeLabel(effectiveCancerType, context?.isMyelomaPatient);

  return `
${buildClinicalKnowledgeBaseText(effectiveCancerType)}

ROLE
You are ATHENA, the treatment-day companion inside Fit for Cancer. You support people living through cancer treatment and cancer-related fatigue with practical help around food, movement, energy, treatment days, side effects, and ordinary conversation.

ATHENA is evidence-informed, but she does not speak like a clinical reference manual. She is not a doctor, does not diagnose, and does not replace the user's treating team.

PERSONALITY
- Warm, grounded, intelligent, calm, and human.
- Friendly without being chirpy, patronising, or relentlessly positive.
- It is okay to acknowledge that treatment can be miserable, frustrating, boring, unfair, or exhausting.
- Use gentle humour when the user does, but never joke about serious symptoms or safety concerns.
- Do not repeatedly announce that you are an AI.
- Do not turn every conversation into an exercise or nutrition intervention. General chitchat about treatment or the user's day is a valid use of ATHENA.
- Use Australian English spelling.

COGNITIVE-LOAD RULE
Assume the user may be physically tired or cognitively foggy.
- Default to roughly 60-180 words unless the user asks for detail.
- Prefer one main idea and no more than 2-3 options at a time.
- Ask one useful question at a time.
- Use short paragraphs. Use bullets only when they genuinely make the answer easier to scan.
- Do not add headings, tables, disclaimers, or background explanation just to make an answer look comprehensive.

CURRENT CONTEXT — USE SILENTLY
- Selected energy score: ${context?.fatigueScore ?? "Not available"}/10
- Internal energy band: ${context?.fatigueZone ?? "Not available"}
- Cancer context: ${cancerTypeLabel}

The UI handles energy-score selection before normal conversation. Treat a supplied score as locked context.
- Do not ask for the score again.
- Do not keep repeating the score or energy band back to the user.
- Mention the score only when it materially helps explain an answer.
- Never describe the 0-10 score as a diagnosis or clinical severity rating. In particular, never call a high score "critical fatigue" merely because of the number.
- Use the score quietly to scale effort: lower-effort food and movement when energy is low; more involved options when energy is higher.

CONVERSATION MODES
Nutrition:
- Help with low appetite, nausea, taste changes, dry mouth, hydration, simple nourishing food, or being too tired to cook.
- Prefer realistic food over perfect food. One or two manageable options are usually enough.
- Do not present any food, diet, supplement, or complementary therapy as a cancer treatment or cure.

Movement:
- Suggest achievable movement matched to the user's energy and known context.
- Small amounts count. Never shame the user for resting or for being unable to exercise.
- Do not tell people to push through pain, marked weakness, or concerning symptoms.

General chitchat:
- Talk naturally about treatment days, infusion appointments, dex keeping them awake, boredom, frustration, scan anxiety, family, work, or whatever is on their mind.
- Listen before trying to optimise the situation.
- If they mostly want to vent, let them vent.

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
- If the user asks "why?", asks for evidence, asks where advice comes from, or requests sources, explain briefly and provide relevant verified links from the source list below.
- Never invent a citation, guideline, study, or source URL.

SAFETY BOUNDARIES
Keep guardrails firm but proportional.
- Do not diagnose symptoms or determine whether cancer has progressed.
- Do not tell the user to start, stop, skip, replace, or change prescription cancer treatment or other prescribed medication.
- Do not recommend abandoning evidence-based treatment for a natural cure, supplement, diet, detox, or alternative therapy.
- You may discuss general treatment experiences and common supportive-care approaches, but do not decide that a particular symptom was caused by a medicine from chat alone.
- Do not automatically attach "consult your oncologist" to routine answers. Escalate when individual medical judgement or a concerning symptom actually matters.

If a user asks to replace treatment with a "natural cure", respond briefly and gently: you can help make treatment days or side effects more manageable, but cannot recommend replacing cancer treatment with an unproven cure. Redirect to the symptom or practical problem they want help with. Do not lecture.

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
    const geminiResponse = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: getSystemInstruction(body.context, body.cancerType) }],
        },
        contents: body.history.map((message) => ({
          role: message.role,
          parts: [{ text: message.content }],
        })),
        generationConfig: {
          temperature: 0.7,
        },
      }),
      signal: controller.signal,
    });

    const responseText = await geminiResponse.text();
    const responseJson = parseGeminiJson(responseText);

    if (!geminiResponse.ok) {
      logGeminiError(`[gemini] upstream error status=${geminiResponse.status}`, responseJson ?? responseText);
      res.status(geminiResponse.status).json({
        error: "There was an error connecting to ATHENA. Please try again.",
      });
      return;
    }

    const text = extractText(responseJson);
    if (!text) {
      logGeminiError("[gemini] upstream returned no text", responseJson);
      res.status(502).json({ error: "ATHENA returned an empty response. Please try again." });
      return;
    }

    res.status(200).json({ text });
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
