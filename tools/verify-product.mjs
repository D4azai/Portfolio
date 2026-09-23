import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { fixture } from "../tests/fixture.mjs";
const f = await fixture({ analytics: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const results = [], errors = [];
await mkdir("artifacts", { recursive: true });
// A virtual production origin exercises real frontend gating and server APIs.
// Supabase identity is a test double; PostgreSQL storage/migrations are real.
f.env.SITE_ORIGIN = "https://portfolio.test";
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
await context.route("https://portfolio.test/**", async route => {
  const url = new URL(route.request().url());
  const response = await route.fetch({ url: `${f.origin}${url.pathname}${url.search}` });
  await route.fulfill({ response });
});
const page = await context.newPage();
page.on("pageerror", error => errors.push(error.message));
async function check(name, run) { await run(); results.push(name); console.log("PASS", name); }
async function axe(label) {
  await page.waitForTimeout(700);
  const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  await writeFile(`artifacts/product-axe-${label}.json`, JSON.stringify(result.violations, null, 2));
  assert.deepEqual(result.violations.map(item => ({ id: item.id, targets: item.nodes.map(node => node.target) })), []);
}
try {
  await check("First entry is skippable; session repeat skips; replay has interactive character", async () => {
    await page.goto("https://portfolio.test/");
    await page.waitForSelector("#entry-dialog[open]");
    assert.equal(await page.locator(".operator-face").count(), 42);
    await page.locator("[data-skip-entry]").click();
    assert.equal(await page.locator("#entry-dialog").evaluate(el => el.open), false);
    await page.reload({ waitUntil: "networkidle" });
    assert.equal(await page.locator("#entry-dialog").evaluate(el => el.open), false);
    await page.locator("[data-replay-entry]").click();
    await page.locator(".operator-scene").hover({ position: { x: 50, y: 60 } });
    await page.waitForTimeout(250);
    assert.notEqual(await page.locator(".operator-model").evaluate(el => el.style.getPropertyValue("--look-y")), "");
    await axe("entry"); await page.screenshot({ path: "artifacts/product-entry.png" });
    await page.keyboard.press("Escape");
  });
  await check("No analytics before consent; opt-in records real page/referrer/project events", async () => {
    assert.equal((await f.db.query("select count(*)::int n from events")).rows[0].n, 0);
    await page.locator("[data-analytics-toggle]").click();
    await page.waitForFunction(() => document.querySelector("[data-analytics-toggle]").getAttribute("aria-pressed") === "true");
    await page.locator(".featured-project").scrollIntoViewIfNeeded(); await page.waitForTimeout(1300);
    await page.locator('[data-case="affiliate"]').click(); await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    const events = (await f.db.query("select name from events")).rows.map(row => row.name);
    assert.ok(events.includes("page_view")); assert.ok(events.includes("project_open")); assert.ok(events.includes("project_view"));
    await page.evaluate(() => {
      // Only a test fixture: the public portfolio does not invent external profiles.
      const link = document.createElement("a"); link.href = "https://github.com/example/test"; link.textContent = "Test source";
      link.addEventListener("click", event => event.preventDefault()); document.body.append(link); link.click(); link.remove();
    });
    await page.waitForTimeout(150);
    assert.ok((await f.db.query("select id from events where name='github_click'")).rows.length);
  });
  await check("Three-step form validates, persists a real submission and reports success", async () => {
    await page.locator("[data-contact]").click();
    await page.locator("[data-next]").click();
    assert.ok(await page.locator('[name="name"]').evaluate(el => el === document.activeElement));
    await page.locator('[name="name"]').fill("Browser test visitor");
    await page.locator('[name="email"]').fill("visitor@example.test");
    await page.locator('[name="company"]').fill("Test engineering lab");
    await axe("form-identity"); await page.screenshot({ path: "artifacts/product-form.png" });
    await page.locator("[data-next]").click();
    await page.locator('[name="contact_type"]').selectOption("Robotics");
    await page.locator('[name="budget"]').fill("To discuss"); await page.locator("[data-next]").click();
    await page.locator('[name="message"]').fill("Test-only enquiry: connect embedded devices to a useful operations view.");
    await page.locator('[name="privacy"]').check(); await page.locator("[data-send]").click();
    await page.waitForSelector(".signal-success:not([hidden])");
    assert.equal((await f.db.query("select count(*)::int n from signals")).rows[0].n, 1);
    await page.waitForTimeout(300);
    assert.ok((await f.db.query("select name from events where name='contact_form_submitted'")).rows.length);
    await axe("form-success"); await page.keyboard.press("Escape");
  });
  await check("Owner login, protected dashboard, real chart and inbox data", async () => {
    const anonymous = await page.goto("https://portfolio.test/admin"); assert.equal(anonymous.status(), 401);
    await page.locator('a[href="/owner/login"]').click();
    await page.locator('[name="email"]').fill(f.owner.email); await page.locator('[name="password"]').fill("test-password");
    await page.locator('button[type="submit"]').click(); await page.waitForURL("**/admin");
    await page.waitForSelector(".metric");
    assert.equal(await page.locator(".metric").count(), 4);
    assert.match(await page.locator("#signal-rows").innerText(), /Browser test visitor/);
    assert.equal(await page.locator("#traffic-chart polyline").count(), 2);
    await axe("dashboard-desktop"); await page.screenshot({ path: "artifacts/product-dashboard.png", fullPage: true });
    await page.reload(); await page.waitForSelector(".metric");
    await page.locator('[data-hours="24"]').click();
    await page.waitForFunction(() => document.querySelectorAll("#traffic-table tr").length <= 25);
  });
  await check("Signal detail, state updates, CSV download, and owner traffic exclusion", async () => {
    await page.locator("#signal-rows button").first().click();
    await page.waitForSelector("#signal-dialog[open]"); assert.match(await page.locator("#signal-detail").innerText(), /Test-only enquiry/);
    await page.locator("#signal-status").selectOption("READ"); await page.locator("#save-status").click();
    await page.waitForFunction(() => document.querySelector("#signal-notice").textContent === "Status saved.");
    assert.equal((await f.db.query("select status from signals")).rows[0].status, "READ");
    await axe("signal-detail"); await page.keyboard.press("Escape");
    await page.locator(".export-controls summary").click();
    const download = page.waitForEvent("download"); await page.locator("#export").click();
    assert.match((await download).suggestedFilename(), /aynko-signals/);
    const count = (await f.db.query("select count(*)::int n from events")).rows[0].n;
    const ownerPage = await context.newPage(); await ownerPage.goto("https://portfolio.test/"); await ownerPage.waitForTimeout(2200);
    assert.equal((await f.db.query("select count(*)::int n from events")).rows[0].n, count); await ownerPage.close();
  });
  await check("Dashboard is responsive at all requested widths and mobile passes axe", async () => {
    for (const width of [320, 375, 390, 430, 768, 1024, 1280, 1440, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}px overflow`);
    }
    await page.setViewportSize({ width: 390, height: 844 }); await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    await axe("dashboard-mobile"); await page.screenshot({ path: "artifacts/product-dashboard-mobile.png" });
  });
  await check("Logout revokes API access and manual dashboard URL entry", async () => {
    await page.locator("#logout").click(); await page.waitForURL("**/owner/login");
    assert.equal((await page.goto("https://portfolio.test/admin")).status(), 401);
  });
  await check("Mobile character fallback and reduced-motion behavior", async () => {
    await page.goto("https://portfolio.test/"); await page.locator("[data-replay-entry]").click();
    assert.equal(await page.locator(".operator-model").isVisible(), false); assert.equal(await page.locator(".operator-fallback").isVisible(), true);
    await axe("entry-mobile"); await page.screenshot({ path: "artifacts/product-entry-mobile.png" });
    await page.emulateMedia({ reducedMotion: "reduce" }); await page.waitForFunction(() => !document.querySelector("#entry-dialog").open);
    await page.reload(); assert.equal(await page.locator("#entry-dialog").evaluate(el => el.open), false);
    await page.locator("[data-contact]").click(); await axe("form-mobile"); await page.keyboard.press("Escape");
    await page.emulateMedia({ reducedMotion: "no-preference" });
  });
  await check("Consent withdrawal stops new events and deletes identifiers", async () => {
    await page.locator("[data-analytics-toggle]").click(); await page.waitForTimeout(300);
    assert.equal(await page.evaluate(() => localStorage.getItem("aynko:visitor")), null);
    const count = (await f.db.query("select count(*)::int n from events")).rows[0].n;
    await page.locator('[data-case="crm"]').click(); await page.keyboard.press("Escape"); await page.waitForTimeout(200);
    assert.equal((await f.db.query("select count(*)::int n from events")).rows[0].n, count);
  });
  await check("Unavailable backend reports an error, preserves inputs, and never shows false success", async () => {
    f.backend.configured = false;
    await page.locator("[data-contact]").click();
    await page.waitForFunction(() => document.querySelector("[data-form-status]").textContent.includes("not configured"));
    await page.locator('[name="name"]').fill("Preserved draft");
    assert.equal(await page.locator(".signal-success").isVisible(), false);
    await page.keyboard.press("Escape");
    f.backend.configured = true;
    await page.locator("[data-contact]").click();
    assert.equal(await page.locator('[name="name"]').inputValue(), "Preserved draft");
    await page.keyboard.press("Escape");
  });
  assert.deepEqual(errors, []);
  await writeFile("artifacts/product-verification.json", JSON.stringify({ results, errors, auth: "test identity provider", database: "actual PostgreSQL via PGlite" }, null, 2));
} finally { await browser.close(); await f.close(); }
