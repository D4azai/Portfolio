import { createHash, createHmac, randomBytes, createCipheriv, createDecipheriv, timingSafeEqual } from "node:crypto";
export const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
export const digest = value => createHash("sha256").update(value).digest("hex");
export const hmac = (secret, value) => createHmac("sha256", secret).update(value).digest("hex");
export const matchesMAC = (actual, expected) => typeof actual === "string" && /^[0-9a-f]{64}$/.test(actual) && actual.length === expected.length && timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
export const nonce = () => randomBytes(32).toString("base64url");
export function seal(value, secret) {
  const iv = randomBytes(12), cipher = createCipheriv("aes-256-gcm", createHash("sha256").update(secret).digest(), iv);
  return Buffer.concat([iv, cipher.update(value), cipher.final(), cipher.getAuthTag()]).toString("base64url");
}
export function unseal(value, secret) {
  const data = Buffer.from(value, "base64url");
  const decipher = createDecipheriv("aes-256-gcm", createHash("sha256").update(secret).digest(), data.subarray(0, 12));
  decipher.setAuthTag(data.subarray(-16));
  return Buffer.concat([decipher.update(data.subarray(12, -16)), decipher.final()]).toString();
}
export function securityHeaders(res) {
  res.setHeader("Cache-Control", "no-store, private");
  res.setHeader("Vary", "Cookie");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
  res.setHeader("Referrer-Policy", "same-origin");
  res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'; object-src 'none'");
}
export async function readJSON(req, max = 16384) {
  if (!/^application\/json(?:;|$)/i.test(req.headers["content-type"] || "")) fail(415, "JSON required");
  if (Number(req.headers["content-length"]) > max) fail(413, "Request too large");
  let body = "";
  if (req.body !== undefined) body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
  else {
    for await (const chunk of req) {
      body += chunk.toString();
      if (Buffer.byteLength(body) > max) fail(413, "Request too large");
    }
  }
  if (Buffer.byteLength(body) > max) fail(413, "Request too large");
  try {
    const data = JSON.parse(body);
    if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error();
    return data;
  } catch { fail(400, "Invalid JSON"); }
}
export function sameOrigin(req, env) {
  if (!env.SITE_ORIGIN || req.headers.origin !== new URL(env.SITE_ORIGIN).origin) fail(403, "Origin not allowed");
  if (req.headers["sec-fetch-site"] === "cross-site") fail(403, "Cross-site request denied");
}
export function cookies(req) {
  return Object.fromEntries((req.headers.cookie || "").split(";").map(part => {
    const i = part.indexOf("="); return i < 0 ? ["", ""] : [part.slice(0, i).trim(), part.slice(i + 1)];
  }));
}
export const cookieName = env => env.SITE_ORIGIN?.startsWith("https:") ? "__Host-aynko_owner" : "aynko_owner";
export function sessionCookie(res, env, value, age) {
  res.setHeader("Set-Cookie", `${cookieName(env)}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${age}${env.SITE_ORIGIN?.startsWith("https:") ? "; Secure" : ""}`);
}
export function plain(value, max, required = false) {
  if (typeof value !== "string") { if (required) fail(422, "Required field missing"); return ""; }
  const clean = value.normalize("NFC").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").trim();
  if (clean.length > max || (required && !clean)) fail(422, "Please check field lengths and required fields");
  return clean; // Plain text only: render through textContent, never HTML.
}
export const validEmail = value => /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value) && value.length <= 254;
export function csv(rows) {
  const columns = ["id", "name", "email", "company", "contact_type", "message", "budget", "timeline", "created_at", "status", "source_page"];
  const cell = value => {
    let text = String(value ?? "");
    if (/^[\s]*[=+@\-]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  };
  return "\uFEFF" + [columns.join(","), ...rows.map(row => columns.map(key => cell(row[key])).join(","))].join("\r\n");
}
