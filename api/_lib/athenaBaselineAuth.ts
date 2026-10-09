import { createPublicKey, verify, type JsonWebKey as NodeJsonWebKey } from "node:crypto";
import { getBaselinePool } from "./athenaBaseline.js";

type HeaderMap = Record<string, string | string[] | undefined>;
export type BaselineUser = { email: string };

const header = (headers: HeaderMap | undefined, name: string) => {
  const entry = Object.entries(headers ?? {}).find(([key]) => key.toLowerCase() === name.toLowerCase())?.[1];
  return Array.isArray(entry) ? entry[0] : entry;
};
const authBaseUrl = () => (process.env.NEON_AUTH_BASE_URL ?? "").replace(/\/$/, "");
const authorisedEmail = () => (process.env.ATHENA_TUNING_EMAIL ?? "").trim().toLowerCase();
const b64urlJson = (input: string) => JSON.parse(Buffer.from(input, "base64url").toString("utf8"));

type SigningJwk = NodeJsonWebKey & { kid?: string; alg?: string; use?: string };
let jwksCache: { keys: SigningJwk[]; expiresAt: number } | undefined;
const getJwks = async () => {
  const url = process.env.NEON_AUTH_JWKS_URL;
  if (!url) throw new Error("Neon Auth is not configured");
  if (jwksCache && jwksCache.expiresAt > Date.now()) return jwksCache.keys;
  const response = await fetch(url, { signal: AbortSignal.timeout(1200) });
  if (!response.ok) throw new Error("Auth key lookup failed");
  const result = await response.json() as { keys?: SigningJwk[] };
  if (!Array.isArray(result.keys)) throw new Error("Auth keys are invalid");
  jwksCache = { keys: result.keys, expiresAt: Date.now() + 5 * 60_000 };
  return result.keys;
};

const bearerToken = (headers?: HeaderMap) => {
  const value = header(headers, "authorization");
  return value?.startsWith("Bearer ") ? value.slice(7) : "";
};

export const verifyBaselineRequest = async (headers?: HeaderMap): Promise<BaselineUser | "forbidden" | null> => {
  const token = bearerToken(headers);
  const allowlisted = authorisedEmail();
  const issuer = authBaseUrl();
  if (!token || !allowlisted || !issuer) return null;
  const chunks = token.split(".");
  if (chunks.length !== 3) return null;
  try {
    const metadata = b64urlJson(chunks[0]);
    const claims = b64urlJson(chunks[1]);
    if (metadata.alg !== "EdDSA" || claims.iss !== issuer || !Number.isFinite(claims.exp) || claims.exp <= Date.now() / 1000) return null;
    if (claims.nbf && claims.nbf > Date.now() / 1000) return null;
    const subject = typeof claims.sub === "string" ? claims.sub : "";
    if (!subject) return null;
    const keys = await getJwks();
    const jwk = keys.find((candidate) => candidate.kid === metadata.kid && candidate.kty === "OKP" && candidate.crv === "Ed25519");
    if (!jwk) return null;
    const key = createPublicKey({ key: jwk, format: "jwk" });
    const valid = verify(null, Buffer.from(`${chunks[0]}.${chunks[1]}`), key, Buffer.from(chunks[2], "base64url"));
    if (!valid) return null;
    const identity = await getBaselinePool().query('SELECT email, "emailVerified" FROM neon_auth."user" WHERE id = $1 LIMIT 1', [subject]);
    const row = identity.rows[0];
    const canonicalEmail = typeof row?.email === "string" ? row.email.trim().toLowerCase() : "";
    return row?.emailVerified === true && canonicalEmail === allowlisted ? { email: canonicalEmail } : "forbidden";
  } catch {
    return null;
  }
};

export const isSameOriginRequest = (headers?: HeaderMap) => {
  const origin = header(headers, "origin");
  const host = header(headers, "x-forwarded-host") ?? header(headers, "host");
  const configured = process.env.ATHENA_TUNING_ORIGIN;
  if (!origin || !host) return false;
  try {
    const parsed = new URL(origin);
    if (configured) return parsed.origin === configured.replace(/\/$/, "");
    const proto = (header(headers, "x-forwarded-proto") ?? "https").split(",")[0].trim();
    return parsed.origin === `${proto}://${host.split(",")[0].trim()}`;
  } catch { return false; }
};

export const requestMagicLink = async (email: string, callbackURL: string) => {
  const authUrl = authBaseUrl();
  const allowed = authorisedEmail();
  if (!authUrl || !allowed || email.trim().toLowerCase() !== allowed) return false;
  const response = await fetch(`${authUrl}/sign-in/magic-link`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: new URL(callbackURL).origin },
    body: JSON.stringify({ email: allowed, callbackURL }),
    signal: AbortSignal.timeout(2500),
  });
  return response.ok;
};
