import type { ChatContext } from "../../types.js";
import { executeAthenaRecommendationTool, MOVEMENT_RECOMMENDATION_CATALOG, RECIPE_RECOMMENDATION_CATALOG, type RecommendationRef } from "../../utils/athenaRecommendations.js";
import { buildAthenaSynthesisMessages, generateAthenaRecovery, generateAthenaSynthesis, type AthenaGoogleToolCall } from "./athenaGoogle.js";
import { getSystemInstruction } from "./athenaPrompt.js";
import type { AthenaBaselineSettings, BaselineScenario } from "./athenaBaseline.js";

const scenarios: Record<BaselineScenario, { title: string; context: ChatContext; prompt: string }> = {
  "fatigue7-movement": {
    title: "Fatigue 7 · movement request",
    context: { fatigueScore: 7, fatigueZone: "🔴 Red", isMyelomaPatient: false },
    prompt: "Could you suggest some gentle movement I can do now?",
  },
  "low-energy-meal": {
    title: "Low energy · food request",
    context: { fatigueScore: 7, fatigueZone: "🔴 Red", isMyelomaPatient: false },
    prompt: "I can barely manage food today. Could you suggest something easy to eat?",
  },
  "general-chat": {
    title: "Treatment day · ordinary conversation",
    context: { fatigueScore: 5, fatigueZone: "🟡 Yellow", isMyelomaPatient: false },
    prompt: "Chemo days are so boring. I have watched every show I like.",
  },
};

export const runAthenaBaselinePreview = async (scenario: BaselineScenario, settings: AthenaBaselineSettings) => {
  const selected = scenarios[scenario];
  const apiKey = process.env.GEMINI_API_KEY;
  if (!selected || !apiKey) throw new Error("Preview is unavailable");
  const history = [{ role: "user" as const, content: selected.prompt }];
  const system = getSystemInstruction(selected.context, undefined, history, settings);
  const signal = AbortSignal.timeout(25_000);
  const selection = await generateAthenaRecovery({ apiKey, system, history, signal });
  const calls = selection.toolCalls as AthenaGoogleToolCall[];
  if (selection.finishReason !== "stop" && !(selection.finishReason === "tool-calls" && calls.length > 0)) {
    throw new Error("Preview generation failed");
  }
  if (!calls.length) {
    const text = selection.text.trim();
    if (!text) throw new Error("Preview returned no response");
    return { scenario, title: selected.title, text, recommendations: [] as RecommendationRef[], settings };
  }

  const seenDomains = new Set<string>();
  const refs: RecommendationRef[] = [];
  const results = calls.map((call) => {
    if (seenDomains.has(call.toolName)) return { status: "skipped", items: [] };
    seenDomains.add(call.toolName);
    const input = call.input && typeof call.input === "object" && !Array.isArray(call.input)
      ? call.input as Record<string, unknown>
      : {};
    const args = Number.isInteger(input.count) ? input : { ...input, count: settings.suggestionCount };
    const result = executeAthenaRecommendationTool(call.toolName, args, selected.context.fatigueZone, []);
    refs.push(...result.refs);
    return result.response;
  });
  const responseMessages = await selection.responseMessages;
  const synthesis = await generateAthenaSynthesis({
    apiKey,
    system,
    messages: buildAthenaSynthesisMessages(history, responseMessages, calls, results),
    signal,
  });
  if (synthesis.finishReason !== "stop" || !synthesis.text.trim()) throw new Error("Preview generation failed");
  const recommendations = refs.map((ref) => {
    const item = ref.kind === "movement"
      ? MOVEMENT_RECOMMENDATION_CATALOG.find((candidate) => candidate.id === ref.id)
      : RECIPE_RECOMMENDATION_CATALOG.find((candidate) => candidate.id === ref.id);
    return { ...ref, ...(item ? { title: item.title } : {}) };
  });
  return { scenario, title: selected.title, text: synthesis.text, recommendations, settings };
};
