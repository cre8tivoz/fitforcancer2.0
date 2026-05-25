interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateLimitBucket>();

const DEFAULT_WINDOW_MS = 10 * 60 * 1000;
const DEFAULT_LIMIT = 20;

const nowMs = () => Date.now();

const cleanupExpiredBuckets = (now = nowMs()) => {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
};

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export const getHeaderValue = (
  headers: Record<string, string | string[] | undefined> | undefined,
  name: string,
): string | undefined => {
  if (!headers) return undefined;
  const lowerName = name.toLowerCase();
  const entry = Object.entries(headers).find(([key]) => key.toLowerCase() === lowerName);
  const value = entry?.[1];
  return Array.isArray(value) ? value[0] : value;
};

export const getClientIp = (headers: Record<string, string | string[] | undefined> | undefined): string => {
  const forwardedFor = getHeaderValue(headers, "x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return getHeaderValue(headers, "x-real-ip")?.trim() || "unknown";
};

export const checkRateLimit = (
  key: string,
  limit = DEFAULT_LIMIT,
  windowMs = DEFAULT_WINDOW_MS,
): RateLimitResult => {
  const now = nowMs();
  cleanupExpiredBuckets(now);

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: Math.max(limit - 1, 0), resetAt };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return { allowed: true, remaining: Math.max(limit - existing.count, 0), resetAt: existing.resetAt };
};

export const checkGeminiRateLimit = (
  headers: Record<string, string | string[] | undefined> | undefined,
): RateLimitResult => {
  const ip = getClientIp(headers);
  return checkRateLimit(`gemini:${ip}`);
};
