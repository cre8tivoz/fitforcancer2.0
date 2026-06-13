import { describe, it, expect } from "vitest";
import { detectFatigueScore, getFatigueZone } from "../utils/fatigueScore";

describe("detectFatigueScore", () => {
  // MUST detect
  it('detects "7"', () => expect(detectFatigueScore("7")).toBe(7));
  it('detects " 10 "', () => expect(detectFatigueScore(" 10 ")).toBe(10));
  it('detects "7/10"', () => expect(detectFatigueScore("7/10")).toBe(7));
  it('detects "3."', () => expect(detectFatigueScore("3.")).toBe(3));
  it('detects "8 out of 10"', () => expect(detectFatigueScore("8 out of 10")).toBe(8));
  it('detects "I\'d say 4/10 today"', () => expect(detectFatigueScore("I'd say 4/10 today")).toBe(4));
  it('detects "my fatigue is 7"', () => expect(detectFatigueScore("my fatigue is 7")).toBe(7));
  it('detects "fatigue 7"', () => expect(detectFatigueScore("fatigue 7")).toBe(7));
  it('detects "My fatigue score is 9"', () => expect(detectFatigueScore("My fatigue score is 9")).toBe(9));
  it('detects "energy is about a 4"', () => expect(detectFatigueScore("energy is about a 4")).toBe(4));

  // MUST return null
  it('returns null for "I did 3 short walks today"', () => {
    expect(detectFatigueScore("I did 3 short walks today")).toBeNull();
  });
  it('returns null for "I walked for 30 minutes"', () => {
    expect(detectFatigueScore("I walked for 30 minutes")).toBeNull();
  });
  it('returns null for "Can I do 2 sessions per day?"', () => {
    expect(detectFatigueScore("Can I do 2 sessions per day?")).toBeNull();
  });
  it('returns null for "I slept 9 hours last night"', () => {
    expect(detectFatigueScore("I slept 9 hours last night")).toBeNull();
  });
  it('returns null for "I\'m tired after 2 meetings"', () => {
    expect(detectFatigueScore("I'm tired after 2 meetings")).toBeNull();
  });
  it('returns null for "What does the 0-10 scale mean?"', () => {
    expect(detectFatigueScore("What does the 0-10 scale mean?")).toBeNull();
  });
  it('returns null for ""', () => expect(detectFatigueScore("")).toBeNull());
  it('returns null for "hello"', () => expect(detectFatigueScore("hello")).toBeNull());
  it('returns null for "11/10" (out of range)', () => expect(detectFatigueScore("11/10")).toBeNull());
  it('returns null for "15"', () => expect(detectFatigueScore("15")).toBeNull());
});

describe("getFatigueZone", () => {
  it('maps 0 to "🟢 Green"', () => expect(getFatigueZone(0)).toBe("🟢 Green"));
  it('maps 3 to "🟢 Green"', () => expect(getFatigueZone(3)).toBe("🟢 Green"));
  it('maps 4 to "🟡 Yellow"', () => expect(getFatigueZone(4)).toBe("🟡 Yellow"));
  it('maps 6 to "🟡 Yellow"', () => expect(getFatigueZone(6)).toBe("🟡 Yellow"));
  it('maps 7 to "🔴 Red"', () => expect(getFatigueZone(7)).toBe("🔴 Red"));
  it('maps 10 to "🔴 Red"', () => expect(getFatigueZone(10)).toBe("🔴 Red"));
});
