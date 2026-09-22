import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

await mkdir("artifacts", { recursive: true });
const label = process.argv[2] || "review";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.on("pageerror", error => console.error(error.message));
await page.goto("http://127.0.0.1:4173", { waitUntil: "networkidle" });
await page.waitForTimeout(1600);
await page.screenshot({ path: `artifacts/${label}-hero.png` });
// Freeze the decorative state for a review image, independent of network speed.
await page.evaluate(() => {
  document.documentElement.classList.remove("intro-complete");
  document.documentElement.classList.add("intro-active");
  document.querySelector(".preloader").style.animation = "none";
});
await page.screenshot({ path: `artifacts/${label}-preloader.png` });
await page.evaluate(() => {
  document.documentElement.classList.remove("intro-active");
  document.querySelector(".preloader").style.removeProperty("animation");
});
for (const id of ["work", "expertise", "method", "about", "faq", "contact"]) {
  await page.locator(`#${id}`).evaluate(el => el.scrollIntoView({ behavior: "instant" }));
  await page.waitForTimeout(750);
  await page.screenshot({ path: `artifacts/${label}-${id}.png` });
}
await page.locator('[data-case="affiliate"]').click();
await page.waitForTimeout(400);
await page.screenshot({ path: `artifacts/${label}-case.png` });
await page.keyboard.press("Escape");
await page.setViewportSize({ width: 375, height: 812 });
await page.goto("http://127.0.0.1:4173", { waitUntil: "networkidle" });
await page.waitForTimeout(1400);
await page.screenshot({ path: `artifacts/${label}-mobile.png` });
await browser.close();
