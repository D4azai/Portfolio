import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";

const base = process.env.AYNKO_TEST_URL || "http://127.0.0.1:4173";
await mkdir("artifacts", { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const results = [], failures = [], errors = [];
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
context.setDefaultTimeout(10000);
const page = await context.newPage();
await page.addInitScript(() => {
  new MutationObserver(() => {
    if (document.documentElement.classList.contains("intro-active") && !window.introStarted) window.introStarted = performance.now();
    if (document.documentElement.classList.contains("intro-complete") && !window.introFinished) window.introFinished = performance.now();
  }).observe(document, { subtree: true, attributes: true, attributeFilter: ["class"] });
});
page.on("pageerror", error => errors.push(error.message));
page.on("response", response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
async function check(name, run) {
  try { await run(); results.push(name); console.log("PASS", name); }
  catch (error) { failures.push({ name, error: error.stack }); console.error("FAIL", name, error.message); }
}
async function audit(target, name) {
  const { violations } = await new AxeBuilder({ page: target }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  await writeFile(`artifacts/axe-${name}.json`, JSON.stringify(violations, null, 2));
  assert.deepEqual(violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })), []);
}
await page.goto(base, { waitUntil: "networkidle" });
await check("First visit completes; repeat visit skips intro", async () => {
  await page.waitForFunction(() => !document.documentElement.classList.contains("intro-active"));
  const duration = await page.evaluate(() => window.introFinished - window.introStarted);
  assert.ok(duration >= 2600 && duration < 3500, `Intro duration before fade: ${duration}ms`);
  assert.ok(await page.evaluate(() => localStorage.getItem("aynko:last-intro")));
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(await page.locator("html").evaluate(el => el.classList.contains("intro-complete")), false);
});
await check("Preserved identity, projects, local fonts and assets", async () => {
  assert.match(await page.locator("h1").innerText(), /Software systems/);
  assert.equal(await page.locator("[data-case]").count(), 5);
  assert.match(await page.locator(".project-grid").innerText(), /UAT/);
  assert.ok(await page.evaluate(() => document.fonts.check("500 16px Manrope")));
  assert.deepEqual(await page.evaluate(() => performance.getEntriesByType("resource").filter(r => !r.name.startsWith(location.origin)).map(r => r.name)), []);
});
await check("Responsive layout, images, sticky navigation and WCAG", async () => {
  for (const width of [320, 375, 430, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const id of ["home", "work", "expertise", "method", "about", "faq", "contact"]) {
      await page.locator(`#${id}`).evaluate(el => el.scrollIntoView({ behavior: "instant" }));
      await page.waitForTimeout(120);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Overflow at ${width}px / ${id}`);
      assert.equal(Math.round((await page.locator(".site-header").boundingBox()).y), 0);
    }
    await page.waitForTimeout(650);
    if ([375, 1440].includes(width)) await audit(page, `page-${width}`);
  }
  await page.waitForFunction(() => [...document.querySelectorAll(".project-media img")].every(img => img.complete && img.naturalWidth > 0));
});
await check("Every case study opens, keeps focus, closes and offers enquiry", async () => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  for (const key of ["affiliate", "erp", "crm", "studioNorth", "northstar"]) {
    const trigger = page.locator(`[data-case="${key}"]`);
    await trigger.click();
    assert.ok(await page.locator(".case-dialog").evaluate(el => el.open));
    const first = page.locator(".dialog-close");
    assert.ok(await first.evaluate(el => el === document.activeElement));
    await page.keyboard.press("Shift+Tab");
    assert.ok(await page.locator(".case-enquiry a").evaluate(el => el === document.activeElement));
    await page.keyboard.press("Tab");
    assert.ok(await first.evaluate(el => el === document.activeElement));
    await page.locator(".case-enquiry").scrollIntoViewIfNeeded();
    if (key === "erp") assert.match(await page.locator(".dialog-kicker").innerText(), /User acceptance testing/);
    if (key === "affiliate") await audit(page, "dialog");
    await page.keyboard.press("Escape");
    assert.ok(await trigger.evaluate(el => el === document.activeElement));
    assert.equal(await page.evaluate(() => document.body.style.overflow), "");
  }
});
await check("Hero explorer opens explanatory cards, case details and restores focus", async () => {
  for (const width of [1440, 375]) {
    await page.setViewportSize({ width, height: 900 });
    await page.locator("[data-explore]").click();
    assert.equal(await page.locator(".explore-card").count(), 5);
    for (const key of ["affiliate", "erp", "crm", "studioNorth", "northstar"]) {
      const card = page.locator(`[data-explore-case="${key}"]`);
      await card.click();
      assert.ok(await page.locator(".case-sections").isVisible());
      await page.locator("[data-explore-back]").click();
      assert.ok(await card.evaluate(el => el === document.activeElement));
    }
    assert.ok(await page.evaluate(() => document.querySelector(".dialog-scroll").scrollWidth <= document.querySelector(".dialog-scroll").clientWidth));
    await audit(page, `explorer-${width}`);
    await page.screenshot({ path: `artifacts/explorer-${width}.png` });
    await page.keyboard.press("Escape");
    assert.ok(await page.locator("[data-explore]").evaluate(el => el === document.activeElement));
    assert.equal(await page.evaluate(() => document.body.style.overflow), "");
  }
});
await check("Four architecture pillars explain their process and support keyboard navigation", async () => {
  for (const width of [1440, 375, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const key of ["data", "flow", "ai", "edge"]) {
      const trigger = page.locator(`[data-pillar="${key}"]`);
      await trigger.focus();
      await page.keyboard.press("Enter");
      assert.ok(await page.locator(".pillar-dialog").isVisible());
      assert.equal(await page.locator(".pillar-step").count(), 3);
      assert.equal(await page.locator(".pillar-deliverable").count(), 3);
      assert.equal(await page.locator(`.pillar-nav [data-pillar-switch="${key}"]`).getAttribute("aria-pressed"), "true");
      assert.ok(await page.evaluate(() => document.querySelector(".dialog-scroll").scrollWidth <= document.querySelector(".dialog-scroll").clientWidth));
      await page.keyboard.press("Shift+Tab");
      assert.ok(await page.locator(".pillar-footer a").evaluate(el => el === document.activeElement));
      await page.keyboard.press("Tab");
      assert.ok(await page.locator(".dialog-close").evaluate(el => el === document.activeElement));
      await page.keyboard.press("Escape");
      assert.ok(await trigger.evaluate(el => el === document.activeElement));
    }
    await page.locator('[data-pillar="data"]').click();
    await page.locator('.pillar-nav [data-pillar-switch="flow"]').click();
    assert.ok(await page.locator("#case-title").evaluate(el => el === document.activeElement));
    assert.match(await page.locator(".dialog-kicker").innerText(), /Flow/);
    await page.locator('.pillar-nav [data-pillar-switch="data"]').click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: `artifacts/pillar-data-${width}.png` });
    if (width !== 320) await audit(page, `pillar-${width}`);
    await page.keyboard.press("Escape");
    assert.ok(await page.locator('[data-pillar="data"]').evaluate(el => el === document.activeElement));
    assert.equal(await page.evaluate(() => document.body.style.overflow), "");
  }
  await page.locator('[data-case="affiliate"]').click();
  assert.equal(await page.locator(".pillar-dialog").count(), 0);
  await page.keyboard.press("Escape");
});
await check("Mobile menu, keyboard FAQ and in-page destination", async () => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.locator(".menu-toggle").click();
  assert.equal(await page.locator(".menu-toggle").getAttribute("aria-expanded"), "true");
  await audit(page, "mobile-menu");
  await page.keyboard.press("Escape");
  assert.ok(await page.locator(".menu-toggle").evaluate(el => el === document.activeElement));
  await page.locator(".menu-toggle").click();
  await page.locator('.site-nav a[href="#about"]').click();
  assert.equal(await page.locator(".menu-toggle").getAttribute("aria-expanded"), "false");
  const summary = page.locator(".faq summary").first();
  await summary.focus();
  await page.keyboard.press("Enter");
  assert.ok(await page.locator(".faq details").first().evaluate(el => el.open));
  await page.keyboard.press("Enter");
  assert.equal(await page.locator(".faq details").first().evaluate(el => el.open), false);
});
await check("Reduced motion and deep links bypass intro", async () => {
  const reduced = await browser.newContext({ reducedMotion: "reduce" });
  const p = await reduced.newPage();
  await p.goto(base);
  assert.equal(await p.locator(".preloader").isVisible(), false);
  await p.waitForTimeout(200);
  assert.equal(await p.evaluate(() => document.getAnimations().filter(a => a.playState === "running").length), 0);
  await reduced.close();
  const fresh = await browser.newContext();
  const deep = await fresh.newPage();
  await deep.goto(`${base}/#work`);
  assert.equal(await deep.locator("html").evaluate(el => el.classList.contains("intro-active")), false);
  await fresh.close();
});
await check("Slow assets, storage denied and live motion changes cannot trap visitors", async () => {
  const fresh = await browser.newContext();
  const p = await fresh.newPage();
  await p.addInitScript(() => {
    window.introObserved = false;
    new MutationObserver(records => {
      if (records.some(r => r.oldValue?.includes("intro-active")) || document.documentElement?.classList.contains("intro-active")) window.introObserved = true;
    }).observe(document, { subtree: true, attributes: true, attributeFilter: ["class"], attributeOldValue: true });
    Object.defineProperty(window, "localStorage", { get() { throw new Error("Storage denied"); } });
  });
  await p.route("**/*.woff2", async route => { await new Promise(resolve => setTimeout(resolve, 1600)); await route.abort(); });
  await p.goto(base, { waitUntil: "domcontentloaded" });
  assert.ok(await p.evaluate(() => window.introObserved));
  await p.waitForFunction(() => !document.documentElement.classList.contains("intro-active"), null, { timeout: 3300 });
  await p.reload({ waitUntil: "domcontentloaded" });
  await p.emulateMedia({ reducedMotion: "reduce" });
  await p.waitForFunction(() => !document.documentElement.classList.contains("intro-active"));
  assert.equal(await p.locator(".preloader").isVisible(), false);
  await fresh.close();
});
await check("No JavaScript: navigation, content, FAQ and email remain usable", async () => {
  const plain = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 375, height: 812 } });
  const p = await plain.newPage();
  await p.goto(base, { waitUntil: "networkidle" });
  assert.equal(await p.locator(".preloader").isVisible(), false);
  assert.ok(await p.locator(".site-nav").isVisible());
  assert.ok(await p.locator("h1").isVisible());
  await p.locator(".faq summary").first().click();
  assert.ok(await p.locator(".faq details p").first().isVisible());
  // axe needs page scripting; this context intentionally disables it.
  assert.ok(await p.locator('.contact-card a[href^="mailto:"]').getAttribute("href"));
  await plain.close();
});
await check("Navigation and content survive unavailable enhancement modules", async () => {
  const p = await context.newPage();
  await p.setViewportSize({ width: 375, height: 812 });
  await p.route("**/script.js", route => route.abort());
  await p.goto(base);
  await p.locator(".menu-toggle").click();
  assert.equal(await p.locator(".menu-toggle").getAttribute("aria-expanded"), "true");
  await p.locator('.site-nav a[href="#about"]').click();
  assert.equal(await p.locator(".menu-toggle").getAttribute("aria-expanded"), "false");
  assert.ok(await p.locator("#about-title").isVisible());
  await p.close();
});
await check("Failed project images preserve readable content and contact", async () => {
  const p = await context.newPage();
  await p.route("**/*.webp", route => route.abort());
  await p.goto(base);
  await p.locator("#contact").scrollIntoViewIfNeeded();
  assert.ok(await p.locator(".contact-card a").isVisible());
  assert.equal(await p.locator("[data-case]").count(), 5);
  await p.close();
});
await check("No browser exceptions or missing resources", () => assert.deepEqual(errors, []));
await writeFile("artifacts/verification-premium.json", JSON.stringify({ results, failures }, null, 2));
await browser.close();
console.log(`${results.length} passed; ${failures.length} failed.`);
if (failures.length) process.exitCode = 1;
