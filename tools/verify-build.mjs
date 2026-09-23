import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { previewServer } from "../server/local.js";
import { createApp } from "../server/app.js";
const root = resolve(import.meta.dirname, "../dist");
const files = (await readdir(root, { recursive: true })).map(file => file.replaceAll("\\", "/"));
assert.equal(files.some(file => /^(server|tests|supabase|node_modules|api)(\/|$)|\.env|admin\.html|package.*json/.test(file)), false, "Private source in public output");
for (const file of files.filter(file => /\.(js|html|css)$/.test(file))) {
  const text = await readFile(resolve(root, file), "utf8");
  assert.doesNotMatch(text, /SUPABASE_SERVICE_ROLE_KEY|SESSION_SECRET|RATE_LIMIT_SECRET|RESEND_API_KEY|test-password|owner-access/);
}
const server = previewServer({ root, app: createApp({ env: {} }) });
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [], missing = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("response", response => { if (response.status() === 404) missing.push(response.url()); });
  await page.goto(base, { waitUntil: "networkidle" });
  await page.waitForFunction(() => !document.querySelector("#entry-dialog").open);
  for (const key of ["affiliate", "erp", "crm", "studioNorth", "northstar"]) {
    await page.locator(`[data-case="${key}"]`).click(); assert.ok(await page.locator(".case-dialog").evaluate(el => el.open)); await page.keyboard.press("Escape");
  }
  await page.locator('[data-pillar="edge"]').click(); assert.ok(await page.locator(".pillar-dialog").isVisible()); await page.keyboard.press("Escape");
  await page.goto(`${base}/privacy.html`); assert.ok(await page.locator("h1").isVisible());
  assert.equal((await page.goto(`${base}/admin`)).status(), 401);
  await page.goto(`${base}/owner/login`); assert.ok(await page.locator("#login-form").isVisible());
  assert.deepEqual(errors, []); assert.deepEqual(missing, []);
  console.log(`Production smoke passed: ${files.length} public paths checked; no private source/secret markers; all cases, architecture, privacy, protected admin and login assets work.`);
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
