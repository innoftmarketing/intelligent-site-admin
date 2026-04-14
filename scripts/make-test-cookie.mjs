// One-off helper: prints a valid admin session cookie for end-to-end testing.
// Uses the same Web Crypto sign() as lib/session.ts so the proxy will accept it.

import { config } from "dotenv";
config({ path: ".env.local" });

const enc = new TextEncoder();
const SESSION_TTL_SECONDS = 60 * 60;

function b64urlEncode(bytes) {
  const buf = typeof bytes === "string" ? enc.encode(bytes) : bytes;
  let s = "";
  for (const b of buf) s += String.fromCharCode(b);
  return btoa(s).replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

const secret = process.env.SESSION_SECRET;
if (!secret) {
  console.error("SESSION_SECRET missing");
  process.exit(1);
}

const payload = {
  sub: "admin",
  exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
};
const body = b64urlEncode(JSON.stringify(payload));

const key = await crypto.subtle.importKey(
  "raw",
  enc.encode(secret),
  { name: "HMAC", hash: "SHA-256" },
  false,
  ["sign"]
);
const sig = new Uint8Array(
  await crypto.subtle.sign("HMAC", key, enc.encode(body))
);
const token = `${body}.${b64urlEncode(sig)}`;

console.log(token);
