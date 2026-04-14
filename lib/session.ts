// Tiny signed-cookie session helper using the Web Crypto API so this module
// works in both the Node runtime (server actions, route handlers) and the
// Edge runtime (Next.js proxy / middleware).

import { headers } from "next/headers";

const COOKIE_NAME = "ispa_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

// Detect whether the current request reached us over HTTPS. We can't rely on
// NODE_ENV for the cookie `secure` flag because deployments on plain HTTP
// (e.g. the Coolify sslip.io URL before a TLS cert is provisioned) would
// then set Secure cookies that the browser immediately discards, causing
// apparent "logout on every action" behavior.
async function isHttpsRequest(): Promise<boolean> {
  try {
    const h = await headers();
    const proto =
      h.get("x-forwarded-proto") ??
      h.get("x-forwarded-protocol") ??
      h.get("x-url-scheme") ??
      "";
    return proto.toLowerCase().startsWith("https");
  } catch {
    // headers() throws outside of a request context (e.g. during build).
    // Default to insecure — nothing to protect outside a real request.
    return false;
  }
}

interface SessionPayload {
  sub: "admin";
  exp: number; // unix seconds
}

function getSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) {
    throw new Error("SESSION_SECRET is not set.");
  }
  return s;
}

const enc = new TextEncoder();
const dec = new TextDecoder();

async function getKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    enc.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function b64urlEncode(bytes: Uint8Array | string): string {
  const buf =
    typeof bytes === "string" ? enc.encode(bytes) : bytes;
  let s = "";
  for (const b of buf) s += String.fromCharCode(b);
  return btoa(s).replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function b64urlDecode(str: string): Uint8Array {
  let s = str.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function sign(payload: SessionPayload): Promise<string> {
  const body = b64urlEncode(JSON.stringify(payload));
  const key = await getKey();
  const sig = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, enc.encode(body))
  );
  return `${body}.${b64urlEncode(sig)}`;
}

export async function verify(
  token: string | undefined
): Promise<SessionPayload | null> {
  if (!token || typeof token !== "string") return null;
  const dot = token.indexOf(".");
  if (dot < 0) return null;
  const body = token.slice(0, dot);
  const sigPart = token.slice(dot + 1);
  let provided: Uint8Array;
  try {
    provided = b64urlDecode(sigPart);
  } catch {
    return null;
  }
  let key: CryptoKey;
  try {
    key = await getKey();
  } catch {
    return null;
  }
  const expected = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, enc.encode(body))
  );
  if (!timingSafeEqual(expected, provided)) return null;
  let payload: SessionPayload;
  try {
    payload = JSON.parse(dec.decode(b64urlDecode(body))) as SessionPayload;
  } catch {
    return null;
  }
  if (payload.sub !== "admin") return null;
  if (
    typeof payload.exp !== "number" ||
    payload.exp < Math.floor(Date.now() / 1000)
  ) {
    return null;
  }
  return payload;
}

export async function freshSessionCookie(): Promise<{
  name: string;
  value: string;
  options: {
    httpOnly: boolean;
    sameSite: "lax";
    secure: boolean;
    path: string;
    maxAge: number;
  };
}> {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const secure = await isHttpsRequest();
  return {
    name: COOKIE_NAME,
    value: await sign({ sub: "admin", exp }),
    options: {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge: SESSION_TTL_SECONDS,
    },
  };
}

export async function expiredSessionCookie() {
  const secure = await isHttpsRequest();
  return {
    name: COOKIE_NAME,
    value: "",
    options: {
      httpOnly: true,
      sameSite: "lax" as const,
      secure,
      path: "/",
      maxAge: 0,
    },
  };
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
