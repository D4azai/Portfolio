import { createBackend } from "./supabase.js";
import { fail, digest, hmac, matchesMAC, nonce, seal, unseal, securityHeaders, readJSON, sameOrigin, cookies, cookieName, sessionCookie, plain, validEmail, csv } from "./security.js";
import { loginPage, adminPage, deniedPage } from "./pages.js";

export const CONTACT_TYPES = ["Job opportunity", "Freelance project", "Collaboration", "Research", "Robotics", "Embedded Systems", "Software Architecture", "Other"];
export const EVENTS = ["page_view", "section_view", "project_view", "project_open", "project_external_click", "github_click", "linkedin_click", "hero_cta_click", "email_click", "contact_click", "contact_form_open", "contact_form_started", "contact_form_submitted", "intro_skipped", "3d_interaction"];
const PROJECTS = ["affiliate", "erp", "crm", "studioNorth", "northstar"];
const SECTIONS = ["home", "work", "expertise", "method", "about", "faq", "contact"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SESSION = /^[A-Za-z0-9_-]{43}$/;
const isProduction = env => env.VERCEL_ENV === "production" && env.ANALYTICS_ENABLED === "true" && new URL(env.SITE_ORIGIN || "http://localhost").hostname !== "localhost";
const secretOK = value => typeof value === "string" && value.length >= 32;
const json = (res, status, data) => { res.statusCode = status; res.setHeader("Content-Type", "application/json; charset=utf-8"); res.end(JSON.stringify(data)); };
const html = (res, status, text) => { res.statusCode = status; res.setHeader("Content-Type", "text/html; charset=utf-8"); res.end(text); };
function method(req, allowed) { if (req.method !== allowed) fail(405, "Method not allowed"); }

export function createApp({ env = process.env, backend = createBackend(env), fetcher = fetch } = {}) {
  const configured = () => backend.configured && secretOK(env.SESSION_SECRET) && secretOK(env.RATE_LIMIT_SECRET);
  async function rate(req, kind, limit, seconds) {
    if (!configured()) fail(503, "This service is not configured yet. Please use the email link.");
    const ip = env.VERCEL === "1" ? String(req.headers["x-vercel-forwarded-for"] || "unknown").split(",")[0].trim() : req.socket?.remoteAddress || "local";
    const key = hmac(env.RATE_LIMIT_SECRET, `${kind}:${new Date().toISOString().slice(0, 10)}:${ip}`);
    if (!await backend.rpc("take_rate", { p_key: key, p_limit: limit, p_seconds: seconds })) fail(429, "Too many requests. Please try again later.");
  }
  function ownerMatches(user) {
    return Boolean(env.ADMIN_USER_ID && env.ADMIN_EMAIL && user?.id === env.ADMIN_USER_ID && user?.email_confirmed_at && user?.email?.toLowerCase() === env.ADMIN_EMAIL.toLowerCase());
  }
  async function authorize(req) {
    const token = cookies(req)[cookieName(env)];
    if (!token || !SESSION.test(token)) fail(401, "Owner sign-in required");
    if (!configured()) fail(503, "Owner access is not configured");
    const [session] = await backend.select("owner_sessions", { token_hash: `eq.${digest(token)}`, select: "*", limit: "1" });
    if (!session || Date.parse(session.expires_at) <= Date.now()) fail(401, "Session expired. Please sign in again.");
    let access;
    try { access = unseal(session.access_token, env.SESSION_SECRET); } catch { fail(401, "Invalid session"); }
    const user = await backend.user(access);
    if (!ownerMatches(user) || session.user_id !== user.id) fail(403, "Owner access only");
    return { user, session, access };
  }
  async function notify() {
    if (!env.RESEND_API_KEY || !env.NOTIFICATION_FROM || !env.ADMIN_EMAIL) return;
    try {
      await fetcher("https://api.resend.com/emails", {
        method: "POST", signal: AbortSignal.timeout(5000),
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: env.NOTIFICATION_FROM, to: [env.ADMIN_EMAIL], subject: "AYNKO — new conversation", text: `A new signal is available in your private inbox. Sign in at ${env.SITE_ORIGIN}/admin. No visitor details are included in this email.` }),
      });
    } catch { /* Persistence already succeeded. Notifications are best effort. */ }
  }
  async function handle(req, res) {
    securityHeaders(res);
    const url = new URL(req.url, "http://internal");
    const route = url.pathname === "/admin" || url.pathname === "/admin/" ? "admin" : url.pathname === "/owner/login" ? "login-page" : url.searchParams.get("route") || "";
    try {
      if (!["GET", "POST", "PATCH", "DELETE"].includes(req.method)) fail(405, "Method not allowed");
      if (req.method !== "GET") sameOrigin(req, env);
      if (route === "login-page") { method(req, "GET"); return html(res, 200, loginPage()); }
      if (route === "admin") { method(req, "GET"); await authorize(req); return html(res, 200, adminPage()); }
      if (route === "login") {
        method(req, "POST"); await rate(req, "login", 8, 900);
        const data = await readJSON(req, 2048);
        const email = plain(data.email, 254, true).toLowerCase();
        if (!validEmail(email) || typeof data.password !== "string" || data.password.length < 1 || data.password.length > 256) fail(401, "Unable to sign in");
        const auth = await backend.signIn(email, data.password);
        const user = await backend.user(auth.access_token);
        if (!ownerMatches(user)) fail(403, "Owner access only");
        // Expiry never exceeds the provider's verified access-token lifetime.
        const lifetime = Math.min(3600, Math.max(0, Number(auth.expires_in) || 0));
        if (lifetime < 60) fail(401, "Please sign in again");
        const token = nonce();
        await backend.insert("owner_sessions", { token_hash: digest(token), user_id: user.id, access_token: seal(auth.access_token, env.SESSION_SECRET), expires_at: new Date(Date.now() + lifetime * 1000).toISOString() });
        sessionCookie(res, env, token, lifetime);
        return json(res, 200, { ok: true });
      }
      if (["session", "logout", "overview", "signals", "signal", "export", "system"].includes(route)) {
        const owner = await authorize(req); // Always before data queries, even for malformed requests.
        if (route === "session") { method(req, "GET"); return json(res, 200, { email: owner.user.email, expires_at: owner.session.expires_at }); }
        if (route === "logout") {
          method(req, "POST");
          await backend.remove("owner_sessions", { token_hash: `eq.${owner.session.token_hash}` });
          sessionCookie(res, env, "", 0);
          await backend.signOut(owner.access).catch(() => {});
          return json(res, 200, { ok: true });
        }
        if (route === "system") { method(req, "GET"); return json(res, 200, { database: "Connected", analytics: isProduction(env), environment: env.VERCEL_ENV || "development", retention_days: 365, notifications: Boolean(env.RESEND_API_KEY && env.NOTIFICATION_FROM), owner: owner.user.email }); }
        if (route === "overview") {
          method(req, "GET"); const hours = Number(url.searchParams.get("hours") || 168);
          if (![24, 168, 720, 2160].includes(hours)) fail(400, "Invalid range");
          return json(res, 200, await backend.rpc("control_overview", { p_hours: hours }));
        }
        if (route === "signals" || route === "export") {
          method(req, "GET");
          const page = Number(url.searchParams.get("page") || 0);
          if (!Number.isInteger(page) || page < 0 || page > 10000) fail(400, "Invalid page");
          const status = url.searchParams.get("status");
          if (status && !["NEW", "READ", "REPLIED", "ARCHIVED"].includes(status)) fail(400, "Invalid status");
          const size = route === "export" ? 500 : 25;
          const query = { select: route === "export" ? "id,name,email,company,contact_type,message,budget,timeline,created_at,status,source_page" : "id,name,company,contact_type,created_at,status", order: "created_at.desc,id.desc", limit: String(size + (route === "export" ? 0 : 1)), offset: String(page * size) };
          if (status) query.status = `eq.${status}`;
          const rows = await backend.select("signals", query);
          if (route === "export") {
            res.setHeader("Content-Type", "text/csv; charset=utf-8"); res.setHeader("Content-Disposition", `attachment; filename="aynko-signals-page-${page + 1}.csv"`); return res.end(csv(rows));
          }
          return json(res, 200, { rows: rows.slice(0, size), more: rows.length > size, page });
        }
        if (route === "signal") {
          const id = url.searchParams.get("id"); if (!UUID.test(id || "")) fail(400, "Invalid signal");
          if (req.method === "GET") {
            const [row] = await backend.select("signals", { id: `eq.${id}`, select: "id,name,email,company,contact_type,message,budget,timeline,created_at,status,source_page", limit: "1" });
            if (!row) fail(404, "Signal not found"); return json(res, 200, row);
          }
          if (req.method === "DELETE") { await backend.remove("signals", { id: `eq.${id}` }); return json(res, 200, { ok: true }); }
          method(req, "PATCH"); const data = await readJSON(req, 1024);
          if (!["NEW", "READ", "REPLIED", "ARCHIVED"].includes(data.status)) fail(422, "Invalid status");
          const rows = await backend.patch("signals", { id: `eq.${id}` }, { status: data.status });
          if (!rows?.length) fail(404, "Signal not found"); return json(res, 200, { ok: true });
        }
      }
      if (route === "form-token") {
        method(req, "GET"); await rate(req, "form-token", 40, 600);
        const payload = `${Date.now()}.${nonce()}`;
        return json(res, 200, { token: `${payload}.${hmac(env.RATE_LIMIT_SECRET, payload)}` });
      }
      if (route === "contact") {
        method(req, "POST"); await rate(req, "contact", 5, 3600);
        const data = await readJSON(req);
        if (data.website) fail(422, "Unable to submit this form");
        const parts = typeof data.token === "string" ? data.token.split(".") : [];
        const elapsed = Date.now() - Number(parts[0]);
        if (parts.length !== 3 || !matchesMAC(parts[2], hmac(env.RATE_LIMIT_SECRET, `${parts[0]}.${parts[1]}`)) || !Number.isFinite(elapsed) || elapsed < 1000 || elapsed > 7200000) fail(422, "Please reopen the form and try again");
        if (!UUID.test(data.request_id || "")) fail(422, "Invalid request");
        const signal = { request_id: data.request_id, name: plain(data.name, 100, true), email: plain(data.email, 254, true).toLowerCase(), company: plain(data.company, 160), contact_type: data.contact_type, message: plain(data.message, 5000), budget: plain(data.budget, 100), timeline: plain(data.timeline, 100), source_page: "/" };
        if (!validEmail(signal.email) || !CONTACT_TYPES.includes(signal.contact_type) || data.privacy !== true) fail(422, "Check your email, request type, and privacy acknowledgement");
        const inserted = await backend.rpc("receive_signal", { p_signal: signal });
        if (inserted) await notify();
        return json(res, 201, { ok: true });
      }
      if (route === "analytics-config") {
        method(req, "GET");
        // Merely having an owner cookie suppresses collection; no private data returned.
        return json(res, 200, { enabled: configured() && isProduction(env) && secretOK(env.ANALYTICS_SECRET) && !cookies(req)[cookieName(env)] });
      }
      if (route === "event") {
        method(req, "POST");
        if (!isProduction(env) || !secretOK(env.ANALYTICS_SECRET) || cookies(req)[cookieName(env)] || req.headers.dnt === "1" || req.headers["sec-gpc"] === "1") return json(res, 202, { recorded: false });
        await rate(req, "events", 120, 600);
        const data = await readJSON(req, 4096);
        if (data.consent !== true || !EVENTS.includes(data.name) || !UUID.test(data.id || "") || !UUID.test(data.visitor || "") || !UUID.test(data.session || "")) fail(422, "Invalid event");
        if (data.project && !PROJECTS.includes(data.project)) fail(422, "Invalid project");
        if (data.section && !SECTIONS.includes(data.section)) fail(422, "Invalid section");
        if (data.name.startsWith("project_") && !PROJECTS.includes(data.project)) fail(422, "Project required");
        const ua = String(req.headers["user-agent"] || "");
        // No heuristic human/bot classification. Enable Vercel's managed bot rules.
        const code = value => typeof value === "string" && /^[a-zA-Z0-9_-]{1,64}$/.test(value) ? value : "";
        let referrer = "Direct / unavailable";
        try { const ref = new URL(data.referrer); if (["https:", "http:"].includes(ref.protocol) && ref.hostname !== new URL(env.SITE_ORIGIN).hostname) referrer = ref.hostname.slice(0, 120); } catch { /* No reliable source. */ }
        const event = { id: data.id, name: data.name, project: data.project || null, section: data.section || null,
          visitor: hmac(env.ANALYTICS_SECRET, data.visitor), session: hmac(env.ANALYTICS_SECRET, data.session),
          referrer, source: code(data.source), medium: code(data.medium), campaign: code(data.campaign),
          device: /iPad|Tablet/i.test(ua) ? "Tablet" : /Mobile|Android/i.test(ua) ? "Mobile" : "Desktop / other",
          browser: /Edg\//.test(ua) ? "Edge" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "Other",
          os: /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Windows/.test(ua) ? "Windows" : /Macintosh/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "Other",
          screen: ["small", "medium", "large"].includes(data.screen) ? data.screen : "unknown", returning_browser: data.returning === true,
          country: env.VERCEL === "1" && /^[A-Z]{2}$/.test(req.headers["x-vercel-ip-country"] || "") ? req.headers["x-vercel-ip-country"] : "" };
        await backend.rpc("record_event", { p_event: event });
        return json(res, 202, { recorded: true });
      }
      fail(404, "Not found");
    } catch (error) {
      const status = [400, 401, 403, 404, 405, 413, 415, 422, 429, 503].includes(error.status) ? error.status : 503;
      if (status === 429) res.setHeader("Retry-After", "900");
      if (route === "admin") return html(res, status, deniedPage(status));
      return json(res, status, { error: error.status ? error.message : "Service unavailable. Please try again later." });
    }
  }
  return handle;
}
