import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

await mkdir("artifacts", { recursive: true });
const label = process.argv[2] || "current";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1,
});
page.on("pageerror", (error) => console.log("PAGE ERROR:", error.message));
page.on("console", (message) => {
  if (message.type() === "error") console.log("CONSOLE:", message.text());
});
await page.goto("http://127.0.0.1:4173", { waitUntil: "networkidle" });
await page.waitForFunction(() => !document.documentElement.classList.contains('motion-ready'));
console.log('Hero settled:', await page.locator('.hero-intro').evaluate(element => getComputedStyle(element).opacity));
await page.screenshot({ path: `artifacts/${label}-hero.png`, animations: 'disabled' });
await page.locator('[data-node="ai"]').click();
console.log(
  "Architecture:",
  await page.locator(".architecture-readout").innerText(),
);
for (const section of ["work", "expertise", "method", "contact"]) {
  await page
    .locator(`#${section}`)
    .evaluate((element) =>
      element.scrollIntoView({ block: "start", behavior: "instant" }),
    );
  await page.waitForTimeout(800);
  await page.screenshot({ path: `artifacts/${label}-${section}.png` });
}
await page.locator('[data-case="affiliate"]').last().click();
await page.waitForTimeout(600);
await page.screenshot({ path: `artifacts/${label}-case.png` });
console.log("Case:", await page.locator("#case-title").innerText());
await page.keyboard.press("Escape");
await page.waitForTimeout(500);
await page.keyboard.press("Control+k");
await page.screenshot({ path: `artifacts/${label}-commands.png` });
await page.keyboard.press("Escape");
await page.setViewportSize({ width: 375, height: 812 });
await page.goto("http://127.0.0.1:4173", { waitUntil: "networkidle" });
await page.waitForTimeout(1300);
await page.screenshot({
  path: `artifacts/${label}-mobile.png`,
  fullPage: true,
});
for (const section of ["home", "architecture", "work", "expertise", "method"]) {
  await page
    .locator(`#${section}`)
    .evaluate((element) =>
      element.scrollIntoView({ block: "start", behavior: "instant" }),
    );
  await page.waitForTimeout(700);
  await page.screenshot({ path: `artifacts/${label}-mobile-${section}.png` });
}
console.log(
  "Mobile width:",
  await page.evaluate(() => ({
    viewport: innerWidth,
    content: document.documentElement.scrollWidth,
  })),
);
await browser.close();
