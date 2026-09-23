// Test-only PostgreSQL and identity-provider double. Never imported by production.
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { createApp } from "../server/app.js";
import { previewServer } from "../server/local.js";
export async function fixture({ analytics = false } = {}) {
  const db = new PGlite();
  await db.exec("create role anon; create role authenticated; create role service_role bypassrls;");
  for (const file of ["001_control.sql", "002_events.sql"]) await db.exec(await readFile(new URL(`../supabase/migrations/${file}`, import.meta.url), "utf8"));
  const owner = { id: "11111111-1111-4111-8111-111111111111", email: "owner@example.test", email_confirmed_at: new Date().toISOString() };
  const normal = { id: "22222222-2222-4222-8222-222222222222", email: "normal@example.test", email_confirmed_at: new Date().toISOString() };
  const users = new Map([["owner-access", owner], ["normal-access", normal]]);
  const identifier = value => { if (!/^[a-z_]+$/.test(value)) throw new Error("Unsafe test identifier"); return `"${value}"`; };
  const tableName = table => { if (!["events", "signals", "owner_sessions", "rate_buckets"].includes(table)) throw new Error("Invalid table"); return identifier(table); };
  const where = (query, values) => {
    const filters = Object.entries(query).filter(([key]) => !["select", "limit", "offset", "order"].includes(key));
    return filters.length ? " where " + filters.map(([key, value]) => { if (!value.startsWith("eq.")) throw new Error("Invalid test filter"); values.push(value.slice(3)); return `${identifier(key)}=$${values.length}`; }).join(" and ") : "";
  };
  const backend = {
    configured: true,
    async signIn(email, password) {
      if (password !== "test-password" || ![owner.email, normal.email].includes(email)) throw Object.assign(new Error("Authentication failed"), { status: 401 });
      return { access_token: email === owner.email ? "owner-access" : "normal-access", expires_in: 3600 };
    },
    async user(token) { if (!users.has(token)) throw Object.assign(new Error("Authentication failed"), { status: 401 }); return users.get(token); },
    async signOut() {},
    async rpc(name, args) {
      const values = Object.values(args || {});
      const result = await db.query(`select ${identifier(name)}(${values.map((_, i) => `$${i + 1}`).join(",")}) as result`, values.map(value => typeof value === "object" ? JSON.stringify(value) : value));
      return result.rows[0].result;
    },
    async select(table, query) {
      const values = [], filter = where(query, values);
      const columns = query.select === "*" ? "*" : query.select.split(",").map(identifier).join(",");
      const order = query.order ? " order by " + query.order.split(",").map(item => { const [key, direction = "asc"] = item.split("."); return `${identifier(key)} ${direction === "desc" ? "desc" : "asc"}`; }).join(",") : "";
      return (await db.query(`select to_jsonb(t) as row from (select ${columns} from ${tableName(table)}${filter}${order} limit ${Number(query.limit || 1000)} offset ${Number(query.offset || 0)}) t`, values)).rows.map(item => item.row);
    },
    async insert(table, data) {
      const keys = Object.keys(data), values = Object.values(data);
      return (await db.query(`insert into ${tableName(table)} (${keys.map(identifier)}) values (${values.map((_, i) => `$${i + 1}`)}) returning *`, values)).rows;
    },
    async patch(table, query, data) {
      const values = Object.values(data), updates = Object.keys(data).map((key, i) => `${identifier(key)}=$${i + 1}`);
      return (await db.query(`update ${tableName(table)} set ${updates}${where(query, values)} returning *`, values)).rows;
    },
    async remove(table, query) { const values = []; await db.query(`delete from ${tableName(table)}${where(query, values)}`, values); },
  };
  const env = { SITE_ORIGIN: "http://127.0.0.1", SESSION_SECRET: "test-session-secret-not-for-production-000", RATE_LIMIT_SECRET: "test-rate-secret-not-for-production-000000", ANALYTICS_SECRET: "test-analytics-secret-not-for-production-000", ADMIN_EMAIL: owner.email, ADMIN_USER_ID: owner.id, VERCEL_ENV: analytics ? "production" : "development", ANALYTICS_ENABLED: String(analytics) };
  const app = createApp({ env, backend });
  const server = previewServer({ app });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${server.address().port}`; env.SITE_ORIGIN = origin;
  const request = (route, { method = "GET", body, cookie, origin: from = origin, headers = {} } = {}) => fetch(`${origin}${route.startsWith("/") ? route : `/api/control?route=${route}`}`, {
    method, headers: { ...(method !== "GET" ? { Origin: from, "Content-Type": "application/json" } : {}), ...(cookie ? { Cookie: cookie } : {}), ...headers }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}), redirect: "manual",
  });
  async function login() { const response = await request("login", { method: "POST", body: { email: owner.email, password: "test-password" } }); if (response.status !== 200) throw new Error(await response.text()); return response.headers.get("set-cookie").split(";")[0]; }
  return { db, backend, env, users, owner, normal, app, server, origin, request, login, async close() { await new Promise(resolve => server.close(resolve)); await db.close(); } };
}
