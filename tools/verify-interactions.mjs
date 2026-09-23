import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const errors = [], passed = [];
page.on("pageerror", error => errors.push(error.message));
const base = process.env.AYNKO_TEST_URL || "http://127.0.0.1:4173";
async function check(name, run) { await run(); passed.push(name); console.log("PASS", name); }
await page.goto(base, { waitUntil: "networkidle" });
await page.waitForTimeout(1300);
await check("Desktop depth, pointer response, connected hover and keyboard", async () => {
  await page.waitForSelector(".system-field.has-depth");
  const before = await page.locator(".system-plane").evaluate(el => getComputedStyle(el).transform);
  await page.locator(".system-field").hover({ position: { x: 70, y: 70 } });
  await page.waitForTimeout(250);
  assert.notEqual(await page.locator(".system-plane").evaluate(el => getComputedStyle(el).transform), before);
  assert.equal(await page.locator(".cursor-ring").getAttribute("data-state"), "explore");
  await page.locator('[data-pillar="data"]').hover();
  assert.match(await page.locator(".system-caption").innerText(), /Shared records/);
  assert.ok(await page.locator('.system-connector[data-connection="data"]').evaluate(el => el.classList.contains("is-connected")));
  await page.locator('[data-pillar="flow"]').focus();
  await page.keyboard.press("Enter");
  assert.ok(await page.locator(".pillar-dialog").isVisible());
  await page.keyboard.press("Escape");
  assert.ok(await page.locator('[data-pillar="flow"]').evaluate(el => el === document.activeElement));
});
await check("Cursor default, action, VIEW, OPEN, MAIL, native selection fallback", async () => {
  for (const [selector, state] of [[".hero-actions .button-primary", "mail"], ["[data-explore]", "action"], ["[data-case=affiliate]", "view"], ['.project-actions a[target="_blank"]', "open"]]) {
    const control = page.locator(selector).first();
    await control.scrollIntoViewIfNeeded();
    await page.waitForTimeout(700);
    await control.hover();
    const box = await control.boundingBox();
    await page.mouse.move(box.x + box.width / 2 + 1, box.y + box.height / 2, { steps: 3 });
    await page.waitForTimeout(100);
    assert.equal(await page.locator(".cursor-ring").getAttribute("data-state"), state);
    assert.ok(await page.locator("html").evaluate(el => el.classList.contains("cursor-visible")));
  }
  await page.locator(".hero-intro").hover();
  await page.waitForTimeout(80);
  assert.equal(await page.locator("html").evaluate(el => el.classList.contains("cursor-visible")), false);
  await page.waitForTimeout(750);
  await page.mouse.move(700, 30, { steps: 4 });
  await page.waitForTimeout(80);
  assert.equal(await page.locator(".cursor-ring").getAttribute("data-state"), "default");
});
await check("Magnetic displacement stays bounded and resets", async () => {
  const button = page.locator(".hero-actions .button-primary");
  await button.hover({ position: { x: 12, y: 12 } });
  await page.waitForTimeout(100);
  const x = await button.evaluate(el => parseFloat(el.style.getPropertyValue("--magnet-x")));
  assert.ok(Math.abs(x) > 0 && Math.abs(x) <= 4);
  await page.mouse.move(1, 1);
  await page.waitForTimeout(80);
  assert.equal(await button.evaluate(el => el.style.getPropertyValue("--magnet-x")), "");
});
await check("Scroll reveals, active navigation and process progression", async () => {
  await page.locator("#work").scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  assert.ok(await page.locator(".featured-project").evaluate(el => el.classList.contains("is-visible")));
  for (let i = 0; i < 4; i++) {
    await page.locator(".method-list li").nth(i).evaluate(el => window.scrollTo({ top: scrollY + el.getBoundingClientRect().top - innerHeight * .54, behavior: "instant" }));
    await page.waitForTimeout(100);
    assert.equal(await page.locator(".method-list li").nth(i).getAttribute("aria-current"), "step");
  }
  assert.equal(await page.locator('.site-nav a[href="#method"]').getAttribute("aria-current"), "location");
});
await check("Live reduced motion removes depth and cursor, cancels animation", async () => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForFunction(() => !document.querySelector(".has-depth") && !document.documentElement.classList.contains("cursor-enabled"));
  assert.equal(await page.locator(".has-depth").count(), 0);
  assert.equal(await page.locator("html").evaluate(el => el.classList.contains("cursor-enabled")), false);
  assert.equal(await page.evaluate(() => document.getAnimations().filter(a => a.playState === "running").length), 0);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.waitForSelector(".has-depth");
  assert.equal(await page.locator(".has-depth").count(), 1);
});
await check("Touch devices retain flat architecture and native pointer", async () => {
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const p = await mobile.newPage(); await p.goto(base, { waitUntil: "networkidle" });
  assert.equal(await p.locator(".has-depth").count(), 0);
  assert.equal(await p.locator("html").evaluate(el => el.classList.contains("cursor-enabled")), false);
  await p.locator('[data-pillar="edge"]').tap();
  assert.ok(await p.locator(".pillar-dialog").isVisible());
  await mobile.close();
});
await check("Optional depth module failure keeps original diagram functional", async () => {
  const p = await context.newPage(); await p.route("**/system-core.js", route => route.abort());
  await p.goto(base); await p.locator('[data-pillar="data"]').click();
  assert.ok(await p.locator(".pillar-dialog").isVisible()); await p.close();
});
await check("Architecture links stay clickable after returning from lower sections", async () => {
  await page.locator("#contact").scrollIntoViewIfNeeded();
  await page.locator('[data-pillar="edge"]').click();
  assert.ok(await page.locator(".pillar-dialog").isVisible());
  await page.keyboard.press("Escape");
});
assert.deepEqual(errors, []);
await check("Unmount lifecycle restores semantic diagram and removes pointer elements", async () => {
  await page.evaluate(() => dispatchEvent(new PageTransitionEvent("pagehide", { persisted: false })));
  assert.equal(await page.locator(".system-plane, .cursor-dot, .cursor-ring").count(), 0);
  assert.equal(await page.locator(".system-field > [data-pillar]").count(), 4);
  assert.equal(await page.locator(".system-connector").count(), 0);
});
await mkdir("artifacts", { recursive: true });
await writeFile("artifacts/verification-interactions.json", JSON.stringify({ passed, errors }, null, 2));
await browser.close();
