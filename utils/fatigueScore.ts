export type FatigueZone = "🟢 Green" | "🟡 Yellow" | "🔴 Red";

export const getFatigueZone = (score: number): FatigueZone =>
  score >= 7 ? "🔴 Red" : score >= 4 ? "🟡 Yellow" : "🟢 Green";

/**
 * Detects an explicitly reported fatigue score (0-10) in a chat message.
 * Returns null unless the message plausibly REPORTS a score:
 *   - the whole message is just a number ("7", "7/10", " 7. ")
 *   - an "N/10" or "N out of 10" phrase appears anywhere
 *   - a number directly follows a fatigue keyword (fatigue/energy/tired/
 *     tiredness/score), allowing only filler words like "is/was/at/about/
 *     around/a/an/level/:/=" between keyword and number
 */
export const detectFatigueScore = (text: string): number | null => {
  if (typeof text !== "string" || text.length === 0) return null;

  // 1. Bare reply: just a number, optional "/10" or "."
  const bareRe = /^\s*(10|[0-9])\s*(?:\/\s*10)?\s*\.?\s*$/;
  const bareMatch = text.match(bareRe);
  if (bareMatch) {
    const n = parseInt(bareMatch[1], 10);
    if (n >= 0 && n <= 10) return n;
  }

  // 2. N out of 10 phrase
  const outOfRe = /\b(10|[0-9])\s*(?:\/|out of)\s*10\b/i;
  const outOfMatch = text.match(outOfRe);
  if (outOfMatch) {
    const n = parseInt(outOfMatch[1], 10);
    if (n >= 0 && n <= 10) return n;
  }

  // 3. Keyword-anchored: keyword then optional filler then number
  const keywordRe =
    /(?:fatigue|energy|tired(?:ness)?|score)(?:\s*(?:level|score|is|was|at|of|about|around|a|an|:|=|-|–))*\s*(10|[0-9])\b/i;
  const keywordMatch = text.match(keywordRe);
  if (keywordMatch) {
    const n = parseInt(keywordMatch[1], 10);
    if (n >= 0 && n <= 10) return n;
  }

  return null;
};
