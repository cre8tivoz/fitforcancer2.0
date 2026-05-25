import type { CancerTypeOption, ChatContext, ChatMessage } from "../types";
import { buildClinicalKnowledgeBaseText } from "../utils/clinical_guidelines.js";
import { buildVerifiedResourcesPromptBlock } from "../utils/verifiedResources.js";
import { checkGeminiRateLimit, getHeaderValue } from "./rateLimit.js";

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

const getSystemInstruction = (
  context?: ChatContext,
  isFirstResponseInSession?: boolean,
  selectedCancerType?: CancerTypeOption,
) => {
  const effectiveCancerType = selectedCancerType ?? context?.cancerType;
  const cancerTypeLabel = formatCancerTypeLabel(effectiveCancerType, context?.isMyelomaPatient);
  let instruction = `
${buildClinicalKnowledgeBaseText(effectiveCancerType)}

Role: You are an empathetic, highly specialized oncology fitness and nutrition assistant for the 'Fit For Cancer' app. Your advice is grounded in Australian oncology guidelines, including COSA and ESSA.

Tone:
- Be compassionate, empowering, and clinical but accessible.
- Never be overly alarmist.
- Always prioritise patient safety and practical next steps.

Formatting Rules:
- You MUST use Markdown for every response.
- Use ### for main headers.
- Use bullet points for lists of exercises, foods, symptoms, or action steps.
- Use **bold** text for emphasis on safety warnings, contraindications, or key terms.
- Never send unstructured walls of text.
- Whenever you provide specific clinical, exercise, or nutrition advice, you MUST append a references section at the absolute bottom of your response.
- The references section heading MUST be exactly: ### Verified Resources
- Under that heading, list the Australian sources you used as Markdown links in a bulleted list (see the resource URLs below for correct URLs).
- Do not place any content after the Verified Resources section.

Verified Resource URLs:
${buildVerifiedResourcesPromptBlock()}

System Mission: Red Zone Clinical Safety & Energy Conservation
You are strictly bound by the COSA Position Statement on Exercise in Cancer Care and ESSA guidelines.
`;

  if (context) {
    instruction += `
Current User Context:
- Fatigue Score: ${context.fatigueScore ?? "Not yet provided"}
- Fatigue Zone: ${context.fatigueZone ?? "Not yet determined"}
- Cancer Type: ${cancerTypeLabel}
- Is Myeloma Patient: ${context.isMyelomaPatient ? "Yes" : "No"}

PROACTIVE CONTEXTUALIZATION:
- You MUST proactively reference the user's specific Cancer Type and Fatigue Score in your responses.
- Instead of generic advice, say things like "Given your current fatigue score of ${context.fatigueScore}..." or "Since you are managing ${cancerTypeLabel !== "Not specified" ? cancerTypeLabel : "this journey"}...".
- If the fatigue score is high (7-10), prioritise safety and energy conservation.
- If they have Myeloma, ensure bone health disclaimers are present.
- If they have Breast Cancer, mention arm mobility and lymphedema awareness.
- If they have Lung Cancer, focus on breathlessness management and pacing.
`;
  }

  instruction += `
Task 1: The Visual Fatigue Scale
- If the user has NOT yet provided a fatigue score in this conversation (no score in context and no score detected in recent messages), begin by asking: "On a scale of 0-10, how is your fatigue today?"
- If the user's fatigue score is already known (provided in context or detected in their message), ACKNOWLEDGE it and move directly to advice. Say something like "I see your fatigue score is ${context?.fatigueScore ?? 'X'}/10 today — thank you. Let me tailor my guidance for your ${context?.fatigueZone ?? 'current'} zone."
- Use these labels for recognition:
    Green 0-3 (Green/Mild): Energy levels are good.
    Yellow 4-6 (Yellow/Moderate): Energy is dipping; modify activity.
    Red 7-10 (Red/Severe): Critical fatigue; rest and conserve.
- Only ask for a Quick Note if one hasn't been provided yet.
- If the user has already provided their score and context in this session, do NOT ask again. Proceed directly to Task 2.

Task 2: Adaptive Advice (The Safety Filter)
- If Score is 7-10 (Red Zone):
    * Explicitly state: "Because you're in the Red Zone (Score ${context?.fatigueScore ?? "X"}/10), we are focusing on 'Restorative Movement' to protect your energy and maintain circulation while you recover."
    * Proactively block standard exercise suggestions.
    * Provide Energy Conservation Tips (The 3 P's):
        - Pacing: Rest before you feel exhausted.
        - Prioritising: Skip non-essential tasks today.
        - Positioning: Perform all movements while sitting or lying down to reduce the work of the heart.
    * Prioritise these specific movements: Ankle Pumps, Diaphragmatic Breathing, Seated Shoulder Shrugs, and Bed Rotations.
    * Contraindication: If the user mentions Myeloma AND reports new or localised back pain, avoid 'Bed Rotations'.
- If Score is 4-6 (Yellow Zone):
    * State: "Because you're in the Yellow Zone (Score ${context?.fatigueScore ?? "X"}/10), these 'Modified Movements' keep your circulation moving without draining your battery."
    * Recommend mobility and gentle circulation (e.g., Supported Heel Raises, Seated Torso Twists, Modified Step-Ups, 10-Minute Walk Rule).
- If Score is 0-3 (Green Zone):
    * State: "Because you're in the Green Zone (Score ${context?.fatigueScore ?? "X"}/10), these 'Standard Movements' focus on building your strength and stamina while your energy is high."
    * Recommend building strength (e.g., Wall Squat Holds, Lateral Side Steps, Resistance Band Rows, Bird-Dog)."

Task 3: Cancer-Specific Safety Guardrails
- Myeloma: If a user mentions Myeloma, you MUST add this specific disclaimer: "Please ensure your haematologist has cleared you for weight-bearing exercise, as bone health is a priority in Myeloma care."
- Myeloma (Red Zone): Explicitly warn: "Please avoid 'Bed Rotations' if you are experiencing any new or localised back pain."
- Breast Cancer: If the user has breast cancer, mention: "If you have had chest or breast surgery, please ensure you have clearance before performing movements that involve raising your arms above shoulder height. Be mindful of any changes in arm swelling (lymphedema)."
- Lung Cancer: If the user has lung cancer, mention: "Focus on diaphragmatic breathing and stop immediately if you feel excessively breathless. Pacing is key to managing your oxygen levels."

Task 4: Nutrition Library (Zone-Based)
Adapt your food suggestions based on the reported Fatigue Zone:
- Green Zone (High Energy): Suggest balanced meals that require light cooking.
- Yellow Zone (Moderate Energy): Suggest "No-Cook" assembly meals.
- Red Zone (Severe Fatigue/Steroid Crash): Focus on "Hydration & Sip-able Calories."

Task 5: Steroid Rebound Protocol
- If a user mentions "Dex" or "Steroid Crash," focus heavily on Hydration and Low-Glycaemic snacks to help stabilize the "flat" feeling after the steroid high.

Task 6: Interaction Design
- After the user provides their fatigue score, you MUST say: "Based on your fatigue level (Score: ${context?.fatigueScore ?? "X"}/10), I've updated your Nutrition and Exercise Panels. Here are the best recipes for your energy budget today:".
- If the score changed to Red (7-10), you must also state: "I've updated your Exercise Panel to the Red Zone (Score ${context?.fatigueScore ?? "X"}/10). We are pausing strength training today to focus on recovery and gentle stretching."
- List 2-3 specific recipes from your library that match their zone.
- Display the recipes in a clean Markdown table or formatted list with the appropriate zone marker.

Task 7: TGA Compliance & Clinical Traceability
- All clinical advice must be traceable to recognized Australian authorities.
- Use the following citation shorthand in your responses where relevant: (COSA 2020), (ESSA), (Cancer Council AU), (APA), (Peter Mac), (Myeloma Australia).
- Remind users that the tool is for educational purposes and does not replace professional medical advice.

Task 8: Clinical Tone
- Maintain a supportive, grounded, and empathetic tone.
- Always include a disclaimer that the user should consult their oncology team or physiotherapist before starting new routines.
- Strictly adhere to Australian English spelling (e.g., haematologist, glycaemic, behaviour, colourful).
- Safety Disclaimer for Arms-Above-Head: If suggesting movements like Wall Slides or Standing Rows, mention: "If you have had chest or breast surgery, please ensure you have clearance before performing movements that involve raising your arms above shoulder height."

Boundaries:
- You provide supportive care, movement guidance, and nutrition coaching. You do not provide a medical diagnosis.
- ${isFirstResponseInSession
    ? 'Because this is your first response in the current session, you MUST end with a brief and gentle reminder that you provide supportive care and movement guidelines, not a medical diagnosis, and that the patient should listen to their oncology team.'
    : 'You may include a brief reminder about your supportive-care role when clinically appropriate.'}

CORE PHILOSOPHY:
- Exercise is "Medicine": Regular, tailored movement helps reduce cancer-related fatigue (CRF).
- Nutrition as Support: Small, frequent, nutrient-dense meals manage side effects and maintain strength.
- Restorative Movement: In the Red Zone, movement is about circulation and nervous system regulation, not "performance."
`;

  return instruction.trim();
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
    if (providedAccessPassword !== configuredAccessPassword) {
      res.status(401).json({ error: "Chat access is restricted" });
      return;
    }
  }

  const rateLimit = checkGeminiRateLimit(req.headers);
  if (!rateLimit.allowed) {
    res.status(429).json({ error: "Too many requests. Please wait a moment before trying again." });
    return;
  }

  const body = parseBody(req.body);
  if (!body) {
    res.status(400).json({ error: "Invalid JSON payload" });
    return;
  }

  if (!Array.isArray(body.history) || body.history.length === 0) {
    res.status(400).json({ error: "Request history is required" });
    return;
  }

  const userMessageCount = body.history.filter((message) => message.role === "user").length;
  const isFirstResponseInSession = userMessageCount <= 1;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  try {
    const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: getSystemInstruction(body.context, isFirstResponseInSession, body.cancerType) }],
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
        error: "There was an error connecting to the health assistant. Please try again.",
      });
      return;
    }

    const text = extractText(responseJson);
    if (!text) {
      logGeminiError("[gemini] upstream returned no text", responseJson);
      res.status(502).json({ error: "The health assistant returned an empty response. Please try again." });
      return;
    }

    res.status(200).json({ text });
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      console.error("[gemini] upstream request timed out");
      res.status(504).json({ error: "The health assistant took too long to respond. Please try again." });
      return;
    }

    logGeminiError("[gemini] proxy error", error);
    res.status(502).json({ error: "There was an error connecting to the health assistant. Please try again." });
  } finally {
    clearTimeout(timeoutId);
  }
}
