import { describe, it, expect, vi, afterEach } from "vitest";
import { checkRateLimit, checkGeminiRateLimit, getClientIp, getHeaderValue } from "../api/rateLimit";

afterEach(() => {
  vi.useRealTimers();
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
});

describe("checkRateLimit", () => {
  it("allows the first call for a key", () => {
    const result = checkRateLimit("test-first-call");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(19);
    expect(result.resetAt).toBeGreaterThan(Date.now());
  });

  it("blocks after limit is reached within the window", () => {
    const key = "test-block-after-limit";
    const limit = 20;

    // Use up all 20 calls
    for (let i = 0; i < limit; i++) {
      const r = checkRateLimit(key);
      expect(r.allowed).toBe(true);
    }

    // 21st call must be blocked
    const blocked = checkRateLimit(key);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("resets after the window expires", () => {
    vi.useFakeTimers();
    const key = "test-window-reset";
    const windowMs = 10 * 60 * 1000;

    // Exhaust the limit in the current window
    for (let i = 0; i < 20; i++) {
      checkRateLimit(key, 20, windowMs);
    }
    const blocked = checkRateLimit(key, 20, windowMs);
    expect(blocked.allowed).toBe(false);

    // Advance past the window
    vi.advanceTimersByTime(windowMs + 1);

    // Should be allowed again with a fresh window
    const fresh = checkRateLimit(key, 20, windowMs);
    expect(fresh.allowed).toBe(true);
    expect(fresh.remaining).toBe(19);
    expect(fresh.resetAt).toBeGreaterThan(blocked.resetAt);
  });
});

describe("getClientIp", () => {
  it("extracts the first IP from x-forwarded-for", () => {
    const result = getClientIp({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" });
    expect(result).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", () => {
    const result = getClientIp({ "x-real-ip": "9.9.9.9" });
    expect(result).toBe("9.9.9.9");
  });

  it("returns 'unknown' when no headers are present", () => {
    expect(getClientIp({})).toBe("unknown");
    expect(getClientIp(undefined)).toBe("unknown");
  });
});

describe("getHeaderValue", () => {
  it("is case-insensitive", () => {
    const result = getHeaderValue({ "X-Real-IP": "9.9.9.9" }, "x-real-ip");
    expect(result).toBe("9.9.9.9");
  });

  it("takes the first element of array values", () => {
    const result = getHeaderValue({ "x-forwarded-for": ["1.1.1.1", "2.2.2.2"] }, "x-forwarded-for");
    expect(result).toBe("1.1.1.1");
  });
});

describe("checkGeminiRateLimit (async)", () => {
  it("falls back to in-memory and allows a fresh IP when Upstash env vars are absent", async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    const result = await checkGeminiRateLimit({ "x-forwarded-for": "10.0.100.1" });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(19);
  });

  it("blocks on the 21st call for the same IP via in-memory fallback", async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    const ip = "10.0.100.2";
    for (let i = 0; i < 20; i++) {
      const r = await checkGeminiRateLimit({ "x-forwarded-for": ip });
      expect(r.allowed).toBe(true);
    }
    const blocked = await checkGeminiRateLimit({ "x-forwarded-for": ip });
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });
});
