import { extractNeonAuthCookies, handleAuthProxyRequest, handleAuthResponse } from "@neondatabase/auth/server";
import { isSameOriginRequest } from "./athenaBaselineAuth.js";

export type AuthProxyRequest = {
  method?: string;
  url?: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: unknown;
  query?: Record<string, string | string[] | undefined>;
};
export type AuthProxyResponse = {
  status(code: number): AuthProxyResponse;
  json?(body: unknown): void;
  send?(body: string): void;
  end?(body?: string): void;
  setHeader?(key: string, value: string | string[]): void;
};

const headerValue = (headers: AuthProxyRequest["headers"], name: string) => {
  const value = Object.entries(headers ?? {}).find(([key]) => key.toLowerCase() === name.toLowerCase())?.[1];
  return Array.isArray(value) ? value[0] : value;
};

const requestOrigin = (req: AuthProxyRequest) => {
  const proto = (headerValue(req.headers, "x-forwarded-proto") ?? "https").split(",")[0].trim();
  const host = (headerValue(req.headers, "x-forwarded-host") ?? headerValue(req.headers, "host") ?? "localhost").split(",")[0].trim();
  return `${proto}://${host}`;
};

const webRequest = (req: AuthProxyRequest, path: string, fallbackOrigin?: string) => {
  const origin = fallbackOrigin ?? requestOrigin(req);
  const requestUrl = new URL(req.url ?? "/api/auth", origin);
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers ?? {})) {
    if (value !== undefined) headers.set(key, Array.isArray(value) ? value.join(", ") : value);
  }
  headers.set("x-neon-auth-middleware", "true");
  const method = (req.method ?? "GET").toUpperCase();
  let body: string | undefined;
  if (method !== "GET" && method !== "HEAD" && req.body !== undefined) {
    body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    if (!headers.has("content-type")) headers.set("content-type", "application/json");
  }
  return new Request(requestUrl, { method, headers, body });
};

const configuredBaseUrl = () => (process.env.NEON_AUTH_BASE_URL ?? "").replace(/\/$/, "");
const cookieSecret = () => process.env.NEON_AUTH_COOKIE_SECRET ?? "";
const cookieConfig = () => ({ secret: cookieSecret(), sameSite: "lax" as const });

export const proxyMagicLink = async (req: AuthProxyRequest, origin: string) => {
  const allowedEmail = (process.env.ATHENA_TUNING_EMAIL ?? "").trim().toLowerCase();
  const submittedEmail = typeof req.body === "object" && req.body !== null && "email" in req.body && typeof (req.body as { email?: unknown }).email === "string"
    ? (req.body as { email: string }).email.trim().toLowerCase()
    : "";
  if (!allowedEmail || submittedEmail !== allowedEmail) return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
  const request = webRequest({
    ...req,
    method: "POST",
    url: "/api/auth/sign-in/magic-link",
    body: { email: allowedEmail, callbackURL: `${origin}/baseline` },
  }, "sign-in/magic-link", origin);
  return handleAuthProxyRequest({ request, path: "sign-in/magic-link", baseUrl: configuredBaseUrl(), cookieSecret: cookieSecret(), sameSite: "lax", domain: new URL(origin).hostname });
};

const verifyMagicLink = async (request: Request) => {
  const baseUrl = configuredBaseUrl();
  const upstreamUrl = new URL(`${baseUrl}/magic-link/verify`);
  upstreamUrl.search = new URL(request.url).search;
  const upstreamHeaders = new Headers({
    "x-neon-auth-middleware": "true",
    origin: requestOriginFromUrl(request.url),
  });
  const userAgent = request.headers.get("user-agent");
  const referer = request.headers.get("referer");
  const authorization = request.headers.get("authorization");
  for (const [key, value] of [["user-agent", userAgent], ["referer", referer], ["authorization", authorization]] as const) if (value) upstreamHeaders.set(key, value);
  const neonCookies = extractNeonAuthCookies(request.headers);
  if (neonCookies) upstreamHeaders.set("cookie", neonCookies);
  const upstream = await fetch(upstreamUrl, { method: "GET", headers: upstreamHeaders, redirect: "manual" });
  const response = await handleAuthResponse(upstream, baseUrl, { ...cookieConfig(), domain: new URL(request.url).hostname });
  const location = upstream.headers.get("location");
  if (location) {
    const destination = new URL(location, request.url);
    const requestOrigin = new URL(request.url).origin;
    if (destination.origin !== requestOrigin || destination.pathname !== "/baseline") return new Response("Invalid authentication redirect", { status: 400 });
    response.headers.set("location", destination.toString());
  }
  return response;
};

const requestOriginFromUrl = (url: string) => new URL(url).origin;

const allowedPath = (method: string, path: string) =>
  (method === "GET" && ["get-session", "token", "magic-link/verify"].includes(path)) ||
  (method === "POST" && path === "sign-out");

export async function handleNeonAuthRoute(req: AuthProxyRequest, res: AuthProxyResponse) {
  res.setHeader?.("Cache-Control", "private, no-store");
  const pathname = req.url ? new URL(req.url, requestOrigin(req)).pathname : "";
  const urlPath = pathname.startsWith("/api/auth/") ? pathname.slice("/api/auth/".length) : "";
  const pathValue = req.query?.path;
  const queryPath = Array.isArray(pathValue) ? pathValue.join("/") : pathValue ?? "";
  const path = urlPath || queryPath;
  const method = (req.method ?? "GET").toUpperCase();
  if (!allowedPath(method, path)) return res.status(404).end?.();
  if (method === "POST" && !isSameOriginRequest(req.headers)) return res.status(403).json?.({ error: "Request origin rejected" });
  const baseUrl = configuredBaseUrl();
  if (!baseUrl || cookieSecret().length < 32) return res.status(503).json?.({ error: "Authentication is unavailable" });

  const request = webRequest(req, path);
  let response: Response;
  try {
    response = path === "magic-link/verify"
      ? await verifyMagicLink(request)
      : await handleAuthProxyRequest({ request, path, baseUrl, cookieSecret: cookieSecret(), sameSite: "lax", domain: new URL(request.url).hostname });
  } catch {
    return res.status(502).json?.({ error: "Authentication request failed" });
  }
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() !== "set-cookie") res.setHeader?.(key, value);
  });
  const cookies = response.headers.getSetCookie();
  if (cookies.length) res.setHeader?.("Set-Cookie", cookies);
  res.status(response.status);
  const payload = await response.text();
  if (res.send) return res.send(payload);
  return res.end?.(payload);
}

