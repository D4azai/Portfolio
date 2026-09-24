import { chromium } from "playwright";
import { writeFile, readFile, readdir } from "node:fs/promises";
import { gzipSync } from "node:zlib";

const browser = await chromium.launch({ channel: "msedge", headless: true });
const results = [];
for (const mobile of [false, true]) {
  const context = await browser.newContext({
    viewport: mobile
      ? { width: 375, height: 812 }
      : { width: 1440, height: 1000 },
    isMobile: mobile,
    hasTouch: mobile,
  });
  const page = await context.newPage();
  await page.bringToFront();
  const session = await context.newCDPSession(page);
  if (mobile) {
    await session.send("Network.enable");
    await session.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 150,
      downloadThroughput: (1.6 * 1024 * 1024) / 8,
      uploadThroughput: (750 * 1024) / 8,
      connectionType: "cellular4g",
    });
    await session.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  }
  await page.addInitScript(() => {
    window.metrics = { lcp: 0, cls: 0, longTasks: [] };
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries())
        window.metrics.lcp = entry.startTime;
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries())
        if (!entry.hadRecentInput) window.metrics.cls += entry.value;
    }).observe({ type: "layout-shift", buffered: true });
    new PerformanceObserver((list) => {
      window.metrics.longTasks.push(
        ...list.getEntries().map((entry) => Math.round(entry.duration)),
      );
    }).observe({ type: "longtask", buffered: true });
  });
  await page.goto(process.env.AYNKO_TEST_URL || "http://127.0.0.1:4173", { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.documentElement.classList.contains("react-ready"));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1800);
  const result = await page.evaluate(() => ({
    ...window.metrics,
    requests: performance.getEntriesByType("resource").length,
    bytes: performance
      .getEntriesByType("resource")
      .reduce((total, item) => total + item.transferSize, 0),
    resources: performance
      .getEntriesByType("resource")
      .map((item) => ({
        name: new URL(item.name).pathname,
        bytes: item.transferSize,
      })),
  }));
  results.push({
    profile: mobile
      ? "375px / 4x CPU / 1.6Mbps / 150ms latency"
      : "1440px / unthrottled local",
    ...result,
  });
  await context.close();
}
const codeFiles = [
  "index.html",
  "assets/app.js",
  "assets/app.css",
  ...(await readdir('assets')).filter(file => /^react-.*\.js$/.test(file)).map(file => `assets/${file}`),
  "experience.css",
];
const code = [];
for (const path of codeFiles) {
  const data = await readFile(path);
  code.push({ path, rawBytes: data.length, gzipBytes: gzipSync(data).length });
}
console.log(
  JSON.stringify(
    {
      results,
      code,
      combinedGzip: code.reduce((sum, item) => sum + item.gzipBytes, 0),
    },
    null,
    2,
  ),
);
await writeFile(
  "artifacts/performance.json",
  JSON.stringify({ results, code }, null, 2),
);
await browser.close();
