// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { generateKeyPairSync, sign } from "node:crypto";
import baselineHandler from "../api/baseline.js";
import baselineAuthHandler from "../api/baseline-auth.js";
import neonAuthProxyHandler from "../api/auth/[...path].js";
import { normaliseBaselineSettings, DEFAULT_ATHENA_BASELINE } from "../api/_lib/athenaBaseline.js";
import { verifyBaselineRequest } from "../api/_lib/athenaBaselineAuth.js";
import { getSystemInstruction } from "../api/_lib/athenaPrompt.js";

const dbQuery = vi.hoisted(() => vi.fn());
vi.mock("@neondatabase/serverless", () => ({
  Pool: class { query = dbQuery; },
}));

const makeResponse = () => {
  const state: { status?: number; body?: unknown; headers: Record<string, string | string[]> } = { headers: {} };
  const response = {
    status(code: number) { state.status = code; return response; },
    json(body: unknown) { state.body = body; },
    send(body: string) { state.body = body; },
    end(body?: string) { state.body = body; },
    setHeader(key: string, value: string | string[]) { state.headers[key] = value; },
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
    vi.stubEnv("NEON_AUTH_BASE_URL", "https://auth.example.test/neondb/auth");
    vi.stubEnv("NEON_AUTH_JWKS_URL", "https://auth.example.test/neondb/auth/.well-known/jwks.json");
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
    expect(await verifyBaselineRequest({ authorization: `Bearer ${token({ iss: "https://wrong.example.test" })}` })).toBeNull();
    expect(await verifyBaselineRequest({ authorization: `Bearer ${token({ iss: "https://auth.example.test/neondb/auth" })}` })).toBeNull();
    dbQuery.mockResolvedValueOnce({ rows: [{ email: "other@example.test", emailVerified: true }] });
    expect(await verifyBaselineRequest({ authorization: `Bearer ${token({ sub: "user-2" })}` })).toBe("forbidden");
    dbQuery.mockResolvedValueOnce({ rows: [{ email: "owner@example.test", emailVerified: false }] });
    expect(await verifyBaselineRequest({ authorization: `Bearer ${token({ sub: "user-3" })}` })).toBe("forbidden");
    expect(await verifyBaselineRequest({ authorization: `Bearer ${token({ exp: Math.floor(Date.now() / 1000) - 1 })}` })).toBeNull();
    const forged = token().replace(/.$/, "A");
    expect(await verifyBaselineRequest({ authorization: `Bearer ${forged}` })).toBeNull();
    vi.stubEnv("NEON_AUTH_BASE_URL", "not a valid URL");
    expect(await verifyBaselineRequest({ authorization: `Bearer ${token()}` })).toBeNull();
  });

  it("serves only the public auth endpoint configuration and requires email setup", async () => {
    vi.stubEnv("NEON_AUTH_BASE_URL", "https://auth.example.test");
    vi.stubEnv("ATHENA_TUNING_EMAIL", " ");
    const { response, state } = makeResponse();
    await baselineAuthHandler({ method: "GET", query: { action: "config" } }, response);
    expect(state.status).toBe(503);
  });

  it("limits the same-origin auth proxy to session, token, and sign-out routes", async () => {
    vi.stubEnv("NEON_AUTH_BASE_URL", "https://auth.example.test");
    vi.stubEnv("NEON_AUTH_COOKIE_SECRET", "x".repeat(32));
    const forbidden = makeResponse();
    await neonAuthProxyHandler({ method: "POST", query: { path: ["sign-up", "email"] }, headers: { origin: "https://app.example.test", host: "app.example.test" } }, forbidden.response);
    expect(forbidden.state.status).toBe(404);

    const verification = makeResponse();
    await neonAuthProxyHandler({ method: "GET", url: "/api/auth/magic-link/verify", headers: { host: "app.example.test" } }, verification.response);
    expect(verification.state.status).toBe(404);

    const crossOrigin = makeResponse();
    await neonAuthProxyHandler({ method: "POST", query: { path: "sign-out" }, headers: { origin: "https://attacker.example", host: "app.example.test" } }, crossOrigin.response);
    expect(crossOrigin.state.status).toBe(403);
  });

  it("proxies a same-origin session request without Origin and rewrites the challenge cookie", async () => {
    vi.stubEnv("NEON_AUTH_BASE_URL", "https://auth.example.test");
    vi.stubEnv("NEON_AUTH_COOKIE_SECRET", "x".repeat(32));
    const upstreamCookie = "__Secure-neon-auth.session_challenge=challenge; Domain=auth.example.test; HttpOnly; Secure; SameSite=None; Path=/";
    const upstreamResponse = new Response("null", { status: 200, headers: { "Content-Type": "application/json", "Set-Cookie": upstreamCookie } });
    const fetchMock = vi.fn().mockResolvedValue(upstreamResponse);
    vi.stubGlobal("fetch", fetchMock);

    const { response, state } = makeResponse();
    await neonAuthProxyHandler({
      method: "GET",
      url: "/api/auth/get-session",
      headers: { host: "app.example.test", "x-forwarded-proto": "https" },
    }, response);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(new Headers(init.headers).get("Origin")).toBe("https://app.example.test");
    expect(new Headers(init.headers).get("x-neon-auth-middleware")).toBe("true");
    const cookies = state.headers["Set-Cookie"];
    expect(cookies).toEqual(expect.arrayContaining([expect.stringContaining("Domain=app.example.test")]));
    const challenge = (cookies as string[]).find(value => value.includes("session_challenge"));
    expect(challenge).toContain("HttpOnly");
    expect(challenge).toContain("Secure");
    expect(challenge).toContain("SameSite=Lax");
  });

  it("sends only the allowlisted address through the Neon SDK proxy with the app callback", async () => {
    vi.stubEnv("NEON_AUTH_BASE_URL", "https://auth.example.test");
    vi.stubEnv("NEON_AUTH_COOKIE_SECRET", "x".repeat(32));
    vi.stubEnv("ATHENA_TUNING_EMAIL", "owner@example.test");
    vi.stubEnv("ATHENA_TUNING_ORIGIN", "https://app.example.test");
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const allowed = makeResponse();
    await baselineAuthHandler({ method: "POST", headers: { origin: "https://app.example.test", host: "app.example.test" }, body: { action: "magicLink", email: "owner@example.test" } }, allowed.response);
    expect(allowed.state.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [target, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(target.toString()).toBe("https://auth.example.test/sign-in/magic-link");
    expect(new Headers(init.headers).get("x-neon-auth-middleware")).toBe("true");
    expect(JSON.parse(String(init.body))).toEqual({ email: "owner@example.test", callbackURL: "https://app.example.test/baseline" });

    const other = makeResponse();
    await baselineAuthHandler({ method: "POST", headers: { origin: "https://app.example.test", host: "app.example.test" }, body: { action: "magicLink", email: "someone-else@example.test" } }, other.response);
    expect(other.state.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("sends and verifies email OTP only for the allowlisted address and forwards the session cookie", async () => {
    vi.stubEnv("NEON_AUTH_BASE_URL", "https://auth.example.test");
    vi.stubEnv("NEON_AUTH_COOKIE_SECRET", "x".repeat(32));
    vi.stubEnv("ATHENA_TUNING_EMAIL", "owner@example.test");
    vi.stubEnv("ATHENA_TUNING_ORIGIN", "https://app.example.test");
    const otpCookie = "__Secure-neon-auth.session_token=session-token; Domain=auth.example.test; HttpOnly; Secure; SameSite=None; Path=/";
    const sendResponse = new Response(JSON.stringify({ success: true }), { status: 200 });
    const verifyResponse = new Response(JSON.stringify({ token: "jwt", user: { email: "owner@example.test" } }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Set-Cookie": otpCookie },
    });
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(sendResponse)
      .mockResolvedValueOnce(verifyResponse)
      .mockResolvedValueOnce(new Response(JSON.stringify({ session: null, user: null }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const sent = makeResponse();
    await baselineAuthHandler({ method: "POST", headers: { origin: "https://app.example.test", host: "app.example.test" }, body: { action: "sendCode", email: "owner@example.test" } }, sent.response);
    expect(sent.state.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [sendUrl, sendInit] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(sendUrl.toString()).toBe("https://auth.example.test/email-otp/send-verification-otp");
    expect(JSON.parse(String(sendInit.body))).toEqual({ email: "owner@example.test", type: "sign-in" });

    const verified = makeResponse();
    await baselineAuthHandler({ method: "POST", headers: { origin: "https://app.example.test", host: "app.example.test" }, body: { action: "verifyCode", email: "owner@example.test", otp: "123456" } }, verified.response);
    expect(verified.state.status).toBe(200);
    const [verifyUrl, verifyInit] = fetchMock.mock.calls[1] as [URL, RequestInit];
    expect(verifyUrl.toString()).toBe("https://auth.example.test/sign-in/email-otp");
    expect(JSON.parse(String(verifyInit.body))).toEqual({ email: "owner@example.test", otp: "123456" });
    const cookies = verified.state.headers["Set-Cookie"] as string[];
    expect(cookies).toEqual(expect.arrayContaining([expect.stringContaining("Domain=app.example.test")]));
    const sessionCookie = cookies.find(value => value.includes("session_token"));
    expect(sessionCookie).toContain("HttpOnly");
    expect(sessionCookie).toContain("Secure");
    expect(sessionCookie).toContain("SameSite=Lax");

    const denied = makeResponse();
    await baselineAuthHandler({ method: "POST", headers: { origin: "https://app.example.test", host: "app.example.test" }, body: { action: "sendCode", email: "someone-else@example.test" } }, denied.response);
    expect(denied.state.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
