import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

await mkdir("artifacts", { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1,
});
page.on("pageerror", (error) => console.log("PAGE ERROR:", error.message));
for (const [name, url] of [
  ["baseline", "http://127.0.0.1:4173"],
  ["live", "https://aynko.vercel.app/"],
]) {
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    await page.screenshot({ path: `artifacts/${name}-hero.png` });
    await page.locator("#work").scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    await page.screenshot({ path: `artifacts/${name}-work.png` });
    console.log(
      name,
      await page.title(),
      await page.locator("h1,h2,h3").allTextContents(),
    );
  } catch (error) {
    console.log(name, error.message);
  }
}
await browser.close();
