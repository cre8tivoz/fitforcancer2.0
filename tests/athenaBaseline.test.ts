import { afterEach, describe, expect, it, vi } from "vitest";
import { generateKeyPairSync, sign } from "node:crypto";
import baselineHandler from "../api/baseline.js";
import baselineAuthHandler from "../api/baseline-auth.js";
import { normaliseBaselineSettings, DEFAULT_ATHENA_BASELINE } from "../api/_lib/athenaBaseline.js";
import { verifyBaselineRequest } from "../api/_lib/athenaBaselineAuth.js";
import { getSystemInstruction } from "../api/_lib/athenaPrompt.js";

const dbQuery = vi.hoisted(() => vi.fn());
vi.mock("@neondatabase/serverless", () => ({
  Pool: class { query = dbQuery; },
}));

const makeResponse = () => {
  const state: { status?: number; body?: unknown; headers: Record<string, string> } = { headers: {} };
  const response = {
    status(code: number) { state.status = code; return response; },
    json(body: unknown) { state.body = body; },
    setHeader(key: string, value: string) { state.headers[key] = value; },
  };
  return { response, state };
};

describe("ATHENA baseline backend boundaries", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("rejects protected settings access without a signed-in token", async () => {
    const { response, state } = makeResponse();
    await baselineHandler({ method: "GET", headers: {} }, response);
    expect(state.status).toBe(401);
  });

  it("rejects cross-origin tuning writes before any database access", async () => {
    vi.stubEnv("ATHENA_TUNING_ORIGIN", "https://app.example.test");
    const { response, state } = makeResponse();
    await baselineHandler({ method: "PUT", headers: { origin: "https://attacker.example" }, body: { action: "saveDraft" } }, response);
    expect(state.status).toBe(403);
  });

  it("fails closed for a malformed token and validates only supported settings", async () => {
    vi.stubEnv("ATHENA_TUNING_EMAIL", "owner@example.test");
    vi.stubEnv("NEON_AUTH_BASE_URL", "https://auth.example.test");
    expect(await verifyBaselineRequest({ authorization: "Bearer not.a.jwt" })).toBeNull();
    expect(normaliseBaselineSettings(DEFAULT_ATHENA_BASELINE)).toEqual(DEFAULT_ATHENA_BASELINE);
    expect(normaliseBaselineSettings({ ...DEFAULT_ATHENA_BASELINE, suggestionCount: 4 })).toBeNull();
    expect(normaliseBaselineSettings({ ...DEFAULT_ATHENA_BASELINE, extraGuidance: "x".repeat(501) })).toBeNull();
  });

  it("leaves the existing clinical prompt byte-for-byte unchanged at bundled defaults", () => {
    const context = { fatigueScore: 7, fatigueZone: "🔴 Red" as const, isMyelomaPatient: false };
    expect(getSystemInstruction(context)).toBe(getSystemInstruction(context, undefined, [], DEFAULT_ATHENA_BASELINE));
  });

  it("accepts a signed Neon identity only when its database email is verified and allowlisted", async () => {
    const { publicKey, privateKey } = generateKeyPairSync("ed25519");
    const jwk = { ...publicKey.export({ format: "jwk" }), kid: "test-key", alg: "EdDSA", use: "sig" };
    vi.stubEnv("ATHENA_TUNING_EMAIL", "owner@example.test");
    vi.stubEnv("NEON_AUTH_BASE_URL", "https://auth.example.test");
    vi.stubEnv("NEON_AUTH_JWKS_URL", "https://auth.example.test/.well-known/jwks.json");
    vi.stubEnv("DATABASE_URL", "postgres://db.example.test/test");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ keys: [jwk] }), { status: 200 })));
    dbQuery.mockResolvedValueOnce({ rows: [{ email: "owner@example.test", emailVerified: true }] });
    const token = (overrides: Record<string, unknown> = {}) => {
      const header = Buffer.from(JSON.stringify({ alg: "EdDSA", kid: "test-key" })).toString("base64url");
      const claims = Buffer.from(JSON.stringify({ iss: "https://auth.example.test", sub: "user-1", exp: Math.floor(Date.now() / 1000) + 60, ...overrides })).toString("base64url");
      const payload = `${header}.${claims}`;
      return `${payload}.${sign(null, Buffer.from(payload), privateKey).toString("base64url")}`;
    };

    expect(await verifyBaselineRequest({ authorization: `Bearer ${token()}` })).toEqual({ email: "owner@example.test" });
    dbQuery.mockResolvedValueOnce({ rows: [{ email: "other@example.test", emailVerified: true }] });
    expect(await verifyBaselineRequest({ authorization: `Bearer ${token({ sub: "user-2" })}` })).toBe("forbidden");
    dbQuery.mockResolvedValueOnce({ rows: [{ email: "owner@example.test", emailVerified: false }] });
    expect(await verifyBaselineRequest({ authorization: `Bearer ${token({ sub: "user-3" })}` })).toBe("forbidden");
    expect(await verifyBaselineRequest({ authorization: `Bearer ${token({ exp: Math.floor(Date.now() / 1000) - 1 })}` })).toBeNull();
    const forged = token().replace(/.$/, "A");
    expect(await verifyBaselineRequest({ authorization: `Bearer ${forged}` })).toBeNull();
  });

  it("serves only the public auth endpoint configuration and requires email setup", async () => {
    vi.stubEnv("NEON_AUTH_BASE_URL", "https://auth.example.test");
    vi.stubEnv("ATHENA_TUNING_EMAIL", " ");
    const { response, state } = makeResponse();
    await baselineAuthHandler({ method: "GET", query: { action: "config" } }, response);
    expect(state.status).toBe(503);
  });
});
