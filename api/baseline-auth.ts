import { isSameOriginRequest, verifyBaselineRequest } from "./_lib/athenaBaselineAuth.js";
import { proxyMagicLink } from "./_lib/neonAuthProxy.js";
import { checkAthenaAuthRateLimit } from "./rateLimit.js";

type Request = { method?: string; headers?: Record<string, string | string[] | undefined>; body?: unknown; query?: Record<string, string | string[] | undefined> };
type Response = { status(code: number): Response; json(body: unknown): void; setHeader?(key: string, value: string | string[]): void };
const asRecord = (value: unknown): Record<string, unknown> => typeof value === "string" ? JSON.parse(value) : value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};

export default async function handler(req: Request, res: Response) {
  res.setHeader?.("Cache-Control", "private, no-store");
  const action = Array.isArray(req.query?.action) ? req.query?.action[0] : req.query?.action;
  if (req.method === "GET" && action === "config") {
    const url = (process.env.NEON_AUTH_BASE_URL ?? "").replace(/\/$/, "");
    return url && process.env.ATHENA_TUNING_EMAIL?.trim()
      ? res.status(200).json({ url: "/api/auth" })
      : res.status(503).json({ error: "Authentication is unavailable" });
  }
  if (req.method === "GET" && action === "session") {
    const user = await verifyBaselineRequest(req.headers);
    if (user === "forbidden") return res.status(403).json({ authenticated: false });
    return res.status(user ? 200 : 401).json(user ? { authenticated: true, user } : { authenticated: false });
  }
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!isSameOriginRequest(req.headers)) return res.status(403).json({ error: "Request origin rejected" });
  const rateLimit = await checkAthenaAuthRateLimit(req.headers);
  if (!rateLimit.allowed) return res.status(429).json({ error: "Unable to send sign-in link" });
  const body = asRecord(req.body);
  if (body.action !== "magicLink" || typeof body.email !== "string") return res.status(400).json({ error: "Invalid request" });
  const originHeader = req.headers?.origin;
  const origin = Array.isArray(originHeader) ? originHeader[0] : originHeader;
  if (!origin) return res.status(403).json({ error: "Request origin rejected" });
  if (body.email.trim().toLowerCase() !== (process.env.ATHENA_TUNING_EMAIL ?? "").trim().toLowerCase()) return res.status(200).json({ ok: true });
  try {
    const upstream = await proxyMagicLink({ ...req, body }, origin);
    if (!upstream.ok) return res.status(502).json({ error: "Unable to send sign-in link" });
    const cookies = upstream.headers.getSetCookie();
    if (cookies.length) res.setHeader?.("Set-Cookie", cookies);
  } catch { return res.status(502).json({ error: "Unable to send sign-in link" }); }
  return res.status(200).json({ ok: true });
}
