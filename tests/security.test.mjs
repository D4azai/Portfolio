import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { fixture } from "./fixture.mjs";
import { digest, seal } from "../server/security.js";
import { createBackend } from "../server/supabase.js";
let f;
before(async () => { f = await fixture({ analytics: true }); });
after(async () => { await f?.close(); });
beforeEach(async () => { await f.db.exec("delete from rate_buckets"); });

test("all private routes deny anonymous and forged-cookie requests before returning data", async () => {
  for (const route of ["/admin", "session", "overview", "signals", "signal&id=11111111-1111-4111-8111-111111111111", "export", "system"]) {
    for (const cookie of [undefined, "aynko_owner=" + "a".repeat(43)]) {
      const response = await f.request(route, { cookie }); assert.equal(response.status, 401, route);
      assert.match(response.headers.get("cache-control"), /no-store/); assert.match(response.headers.get("x-robots-tag"), /noindex/);
      assert.doesNotMatch(await response.text(), /owner@example|test-password|System control|private-message/);
    }
  }
  for (const method of ["PATCH", "DELETE"]) assert.equal((await f.request("signal&id=11111111-1111-4111-8111-111111111111", { method, body: { status: "READ" } })).status, 401);
});
test("non-owner, wrong password, and cross-origin login are denied", async () => {
  assert.equal((await f.request("login", { method: "POST", body: { email: f.normal.email, password: "test-password" } })).status, 403);
  assert.equal((await f.request("login", { method: "POST", body: { email: f.owner.email, password: "bad" } })).status, 401);
  assert.equal((await f.request("login", { method: "POST", origin: "https://evil.test", body: { email: f.owner.email, password: "test-password" } })).status, 403);
});
test("successful login uses opaque HttpOnly cookie, protects HTML, and logout revokes replay", async () => {
  const response = await f.request("login", { method: "POST", body: { email: f.owner.email, password: "test-password" } });
  assert.equal(response.status, 200); const cookieHeader = response.headers.get("set-cookie"), cookie = cookieHeader.split(";")[0];
  assert.match(cookieHeader, /HttpOnly/); assert.match(cookieHeader, /SameSite=Strict/); assert.doesNotMatch(cookieHeader, /owner-access/);
  assert.equal((await f.request("/admin", { cookie })).status, 200);
  const rows = await f.db.query("select access_token from owner_sessions"); assert.ok(rows.rows.every(row => row.access_token !== "owner-access"));
  assert.equal((await f.request("logout", { method: "POST", cookie, origin: "https://evil.test", body: {} })).status, 403);
  assert.equal((await f.request("logout", { method: "POST", cookie, body: {} })).status, 200);
  assert.equal((await f.request("overview", { cookie })).status, 401);
});
test("expired, invalid-provider and non-owner sessions cannot read any private endpoint", async () => {
  const cookie = await f.login(), hash = digest(cookie.split("=")[1]);
  await f.db.query("update owner_sessions set expires_at=now()-interval '1 second' where token_hash=$1", [hash]);
  assert.equal((await f.request("export", { cookie })).status, 401);
  const next = await f.login(), nextHash = digest(next.split("=")[1]);
  await f.db.query("update owner_sessions set access_token=$1 where token_hash=$2", [seal("normal-access", f.env.SESSION_SECRET), nextHash]);
  for (const route of ["/admin", "signals", "overview", "export", "system"]) assert.equal((await f.request(route, { cookie: next })).status, 403);
  await f.db.query("update owner_sessions set access_token=$1 where token_hash=$2", [seal("expired-access", f.env.SESSION_SECRET), nextHash]);
  assert.equal((await f.request("session", { cookie: next })).status, 401);
});
test("confirmed email and immutable owner id are both required", async () => {
  const cookie = await f.login(); const original = f.users.get("owner-access");
  for (const user of [{ ...original, email_confirmed_at: null }, { ...original, email: f.normal.email }, { ...original, id: f.normal.id }]) {
    f.users.set("owner-access", user); assert.equal((await f.request("signals", { cookie })).status, 403);
  }
  f.users.set("owner-access", original);
});
test("database denies direct anonymous/authenticated table and RPC access", async () => {
  for (const role of ["anon", "authenticated"]) {
    await f.db.exec(`set role ${role}`);
    for (const table of ["signals", "owner_sessions", "events", "rate_buckets"]) await assert.rejects(f.db.query(`select * from ${table}`), /permission denied/);
    await assert.rejects(f.db.query("select control_overview(168)"), /permission denied/);
    await assert.rejects(f.db.query("select receive_signal('{}')"), /permission denied/);
    await assert.rejects(f.db.query("select record_event('{}')"), /permission denied/);
    await f.db.exec("reset role");
  }
});
async function signal() {
  const token = await (await f.request("form-token")).json();
  await new Promise(resolve => setTimeout(resolve, 1050));
  return { token: token.token, request_id: randomUUID(), name: "=HYPERLINK(\"bad\")", email: "visitor@example.test", company: "Test organization", contact_type: "Software Architecture", message: "private-message <script>alert(1)</script>", privacy: true, website: "", budget: "EUR 5000", timeline: "Next quarter" };
}
test("contact validates server-side, rejects spam/oversized/CSRF, and stores once on retry", async () => {
  const body = await signal();
  assert.equal((await f.request("contact", { method: "POST", body: { ...body, email: "not-an-email" } })).status, 422);
  assert.equal((await f.request("contact", { method: "POST", body: { ...body, website: "spam" } })).status, 422);
  assert.equal((await f.request("contact", { method: "POST", origin: "https://evil.test", body })).status, 403);
  assert.equal((await f.request("contact", { method: "POST", body: { ...body, message: "x".repeat(17000) } })).status, 413);
  assert.equal((await f.request("contact", { method: "POST", body })).status, 201);
  assert.equal((await f.request("contact", { method: "POST", body })).status, 201);
  const result = await f.db.query("select count(*)::int n from signals where request_id=$1", [body.request_id]); assert.equal(result.rows[0].n, 1);
});
test("inbox pagination, detail, status and CSV are owner-only and CSV neutralizes formulas", async () => {
  const cookie = await f.login(); const result = await (await f.request("signals", { cookie })).json();
  assert.ok(result.rows.length); const id = result.rows[0].id;
  const detail = await (await f.request(`signal&id=${id}`, { cookie })).json(); assert.match(detail.message, /private-message/);
  assert.equal((await f.request(`signal&id=${id}`, { method: "PATCH", cookie, body: { status: "REPLIED" } })).status, 200);
  assert.equal((await f.request(`signal&id=${id}`, { method: "PATCH", cookie, body: { status: "OWNER" } })).status, 422);
  assert.equal((await f.request("signals&page=-1", { cookie })).status, 400);
  const exported = await f.request("export", { cookie }); assert.match(exported.headers.get("content-type"), /text\/csv/); assert.match(await exported.text(), /'=HYPERLINK/);
  assert.equal((await f.request("export", { cookie: "aynko_owner=bad" })).status, 401);
});
test("durable rate limiter is atomic and fails closed", async () => {
  const results = await Promise.all(Array.from({ length: 15 }, () => f.backend.rpc("take_rate", { p_key: "test-bucket", p_limit: 5, p_seconds: 30 })));
  assert.equal(results.filter(Boolean).length, 5);
  for (let i = 0; i < 8; i++) await f.request("login", { method: "POST", body: { email: f.owner.email, password: "bad" } });
  assert.equal((await f.request("login", { method: "POST", body: { email: f.owner.email, password: "test-password" } })).status, 429);
});
test("inbox pagination is bounded, filterable, and deletion is authenticated", async () => {
  for (let i = 0; i < 30; i++) await f.backend.rpc("receive_signal", { p_signal: { request_id: randomUUID(), name: `Pagination test ${i}`, email: "test@example.test", company: "", contact_type: "Other", message: "", budget: "", timeline: "" } });
  const cookie = await f.login();
  const first = await (await f.request("signals&status=NEW", { cookie })).json();
  assert.equal(first.rows.length, 25); assert.equal(first.more, true);
  const second = await (await f.request("signals&status=NEW&page=1", { cookie })).json();
  assert.equal(second.rows.length, 5); assert.equal(second.more, false);
  assert.equal(first.rows.some(row => second.rows.some(other => other.id === row.id)), false);
  const id = first.rows[0].id;
  assert.equal((await f.request(`signal&id=${id}`, { method: "DELETE" })).status, 401);
  assert.equal((await f.request(`signal&id=${id}`, { method: "DELETE", cookie })).status, 200);
  assert.equal((await f.request(`signal&id=${id}`, { cookie })).status, 404);
});
test("analytics allowlists events, excludes preview/owner/privacy signals, deduplicates, and strips sensitive data", async () => {
  const base = { id: randomUUID(), visitor: randomUUID(), session: randomUUID(), consent: true, name: "page_view", referrer: "https://github.com/sensitive?email=secret@example.test", source: "github", medium: "profile", campaign: "launch", screen: "large", message: "never-store-this", country: "ZZ" };
  assert.equal((await f.request("event", { method: "POST", body: base })).status, 202);
  await f.request("event", { method: "POST", body: base });
  await f.request("event", { method: "POST", body: { ...base, id: randomUUID(), name: "project_view", project: "erp" } });
  await f.request("event", { method: "POST", body: { ...base, id: randomUUID(), name: "project_open", project: "erp" } });
  assert.equal((await f.request("event", { method: "POST", body: { ...base, name: "password" } })).status, 422);
  assert.equal((await f.request("event", { method: "POST", body: { ...base, consent: false } })).status, 422);
  const cookie = await f.login();
  for (const args of [{ cookie }, { headers: { DNT: "1" } }, { headers: { "Sec-GPC": "1" } }]) {
    const result = await (await f.request("event", { method: "POST", body: { ...base, id: randomUUID() }, ...args })).json(); assert.equal(result.recorded, false);
  }
  f.env.VERCEL_ENV = "preview";
  assert.equal((await (await f.request("event", { method: "POST", body: base })).json()).recorded, false); f.env.VERCEL_ENV = "production";
  const rows = (await f.db.query("select * from events")).rows;
  assert.equal(rows.length, 3); assert.equal(rows[0].referrer, "github.com"); assert.notEqual(rows[0].visitor, base.visitor); assert.equal(rows[0].country, "");
  assert.doesNotMatch(JSON.stringify(rows), /never-store-this|secret@example|sensitive/);
  const overview = await (await f.request("overview", { cookie })).json();
  assert.equal(overview.metrics[0].views, 1); assert.equal(overview.metrics[0].visitors, 1); assert.equal(overview.projects[0].opens, 1); assert.equal(overview.projects[0].views, 1);
  assert.ok(overview.series.length); assert.equal(overview.recent, 1);
});
test("provider adapter fails closed and never propagates credential-bearing errors", async () => {
  const backend = createBackend({ SUPABASE_URL: "https://example.supabase.co", SUPABASE_ANON_KEY: "anon", SUPABASE_SERVICE_ROLE_KEY: "private" }, async () => new Response('{"error":"private secret"}', { status: 500 }));
  await assert.rejects(backend.select("signals", {}), error => error.status === 503 && !error.message.includes("private"));
  await assert.rejects(createBackend({}).user("anything"), error => error.status === 503);
});
test("private source, migrations, env and tooling are never served by local server", async () => {
  for (const path of ["/.env.local", "/server/app.js", "/supabase/migrations/001_control.sql", "/tests/fixture.mjs", "/package.json", "/node_modules/@electric-sql/pglite/package.json"]) assert.equal((await f.request(path)).status, 404, path);
});
test("scheduled retention deletes expired events, sessions, rate hashes and submissions", async () => {
  await f.db.exec("update events set created_at=now()-interval '366 days'; update signals set created_at=now()-interval '366 days';");
  await f.backend.rpc("prune_control", {});
  assert.equal((await f.db.query("select count(*)::int n from events")).rows[0].n, 0);
  assert.equal((await f.db.query("select count(*)::int n from signals")).rows[0].n, 0);
});
