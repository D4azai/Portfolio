import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";

const base = process.env.AYNKO_TEST_URL || "http://127.0.0.1:4173";
await mkdir("artifacts", { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const failures = [];
const results = [];
const errors = [];
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
});
const page = await context.newPage();
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
page.on("response", (response) => {
  if (response.status() >= 400)
    errors.push(`${response.status()} ${response.url()}`);
});

async function check(name, run) {
  try {
    await run();
    results.push(name);
    console.log("PASS", name);
  } catch (error) {
    failures.push({ name, error: error.message, stack: error.stack });
    console.error("FAIL", name, error.stack);
    await page.goto(base, { waitUntil: "networkidle" });
    await settle();
  }
}
async function settle() {
  await page.waitForTimeout(750);
}
async function goHome() {
  await page.goto(base, { waitUntil: "networkidle" });
  await settle();
}
async function accessibility(name, targetPage = page) {
  const result = await new AxeBuilder({ page: targetPage })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"])
    .analyze();
  await writeFile(
    `artifacts/axe-${name}.json`,
    JSON.stringify(result.violations, null, 2),
  );
  assert.deepEqual(
    result.violations.map((item) => ({
      rule: item.id,
      targets: item.nodes.map((node) => node.target),
    })),
    [],
  );
}

await goHome();
await check("Local fonts and preserved identity", async () => {
  assert.match(await page.locator("h1").innerText(), /Software systems/);
  assert.match(
    await page.locator(".hero .eyebrow").innerText(),
    /Software Engineer & Systems Architect/i,
  );
  assert.equal(
    await page.evaluate(() => document.fonts.check("500 16px Manrope")),
    true,
  );
  const external = await page.evaluate(() =>
    performance
      .getEntriesByType("resource")
      .filter((item) => !item.name.startsWith(location.origin)),
  );
  assert.deepEqual(external, []);
});
await check("Architecture supports mouse, focus and arrow keys", async () => {
  await page.locator('[data-node="flow"]').hover();
  assert.match(
    await page.locator(".architecture-readout").innerText(),
    /02 \/ FLOW/,
  );
  await page.locator('[data-node="ai"]').focus();
  assert.match(
    await page.locator(".architecture-readout").innerText(),
    /03 \/ AI/,
  );
  await page.keyboard.press("ArrowDown");
  assert.equal(
    await page.locator('[data-node="edge"]').getAttribute("aria-pressed"),
    "true",
  );
});
await check("Context cursor and native text fallback", async () => {
  await page.locator('.hero-actions a[href^="mailto:"]').hover();
  assert.equal(
    await page.locator(".cursor-reticle span").innerText(),
    "MAIL ↗",
  );
  assert.equal(
    await page
      .locator("html")
      .evaluate((element) => element.classList.contains("cursor-visible")),
    true,
  );
  await page.locator(".hero-intro").hover();
  assert.equal(
    await page
      .locator("html")
      .evaluate((element) => element.classList.contains("cursor-visible")),
    false,
  );
  const link = page.locator(".featured-project .project-media a");
  await link.hover();
  assert.equal(await page.locator(".cursor-reticle span").innerText(), "VIEW");
  await page.keyboard.press("Tab");
  assert.equal(
    await page
      .locator("html")
      .evaluate((element) => element.classList.contains("cursor-visible")),
    false,
  );
});
await check("Desktop WCAG automated checks", () => accessibility("desktop"));

for (const [key, title] of Object.entries({
  affiliate: "Maroc Affiliate",
  erp: "Construction Site ERP",
  crm: "CRM",
  studioNorth: "Studio North",
  northstar: "Northstar",
})) {
  await check(
    `Case study: ${title}, all chapters, focus and close`,
    async () => {
      const link = page.locator(`main .text-action[data-case="${key}"]`);
      await link.click();
      await settle();
      assert.equal(await page.locator("#case-title").innerText(), title);
      assert.equal(await page.locator(".case-section").count(), 6);
      assert.equal(await page.locator(".case-flow li").count(), 4);
      assert.ok(page.url().endsWith(`#case/${key}`));
      assert.equal(
        await page.evaluate(() =>
          document.activeElement.matches(".dialog-close"),
        ),
        true,
      );
      await page.keyboard.press("Shift+Tab");
      assert.equal(
        await page.evaluate(() =>
          Boolean(document.activeElement.closest(".case-dialog")),
        ),
        true,
      );
      await accessibility(`case-${key}`);
      await page.keyboard.press("Escape");
      await settle();
      assert.equal(
        await page.locator(".case-dialog").evaluate((element) => element.open),
        false,
      );
      assert.equal(await page.evaluate(() => document.body.style.overflow), "");
      assert.equal(
        await link.evaluate((element) => document.activeElement === element),
        true,
      );
    },
  );
}
await check("Case routing: next, Back, Forward and direct link", async () => {
  await page.locator('main .text-action[data-case="affiliate"]').click();
  await settle();
  await page.locator('.case-footer [data-case="erp"]').click();
  await settle();
  assert.equal(
    await page.locator("#case-title").innerText(),
    "Construction Site ERP",
  );
  await page.goBack();
  await settle();
  assert.equal(
    await page.locator(".case-dialog").evaluate((element) => element.open),
    false,
  );
  await page.goForward();
  await settle();
  assert.equal(
    await page.locator("#case-title").innerText(),
    "Construction Site ERP",
  );
  await page.goto(`${base}/#case/crm`, { waitUntil: "networkidle" });
  await settle();
  assert.equal(await page.locator("#case-title").innerText(), "CRM");
  await page.locator(".dialog-close").click();
  await settle();
  assert.ok(page.url().endsWith("#work"));
  assert.equal(
    await page.locator(".case-dialog").evaluate((element) => element.open),
    false,
  );
});
await check("View Transition fallback remains functional", async () => {
  await page.evaluate(() => {
    document.startViewTransition = undefined;
  });
  await page.locator('main .text-action[data-case="studioNorth"]').click();
  await settle();
  assert.equal(await page.locator("#case-title").innerText(), "Studio North");
  await page.locator(".dialog-close").click();
  await settle();
  assert.equal(
    await page.locator(".case-dialog").evaluate((element) => element.open),
    false,
  );
});
await check(
  "Unknown case URLs and interrupted transitions recover safely",
  async () => {
    await page.goto(`${base}/#case/__proto__`, { waitUntil: "networkidle" });
    assert.equal(
      await page.locator(".case-dialog").evaluate((element) => element.open),
      false,
    );
    await page
      .locator('main .text-action[data-case="affiliate"]')
      .evaluate((link) => {
        link.click();
        history.back();
      });
    await settle();
    assert.equal(
      await page.locator(".case-dialog").evaluate((element) => element.open),
      false,
    );
    assert.equal(await page.evaluate(() => document.body.style.overflow), "");
    await page.locator('main .text-action[data-case="crm"]').click();
    await settle();
    assert.equal(await page.locator("#case-title").innerText(), "CRM");
    await page.keyboard.press("Escape");
    await settle();
  },
);
await check(
  "Capabilities connect the selected module to the output",
  async () => {
    await page.locator('[data-capability="operations"] button').click();
    assert.equal(
      await page
        .locator('[data-capability-path="operations"]')
        .evaluate((element) => element.classList.contains("is-active")),
      true,
    );
    assert.match(
      await page.locator(".capability-output").innerText(),
      /Connected teams/,
    );
  },
);
await check(
  "Method advances and navigation tracks the active section",
  async () => {
    for (let i = 0; i < 4; i++) {
      await page
        .locator(".method-list li")
        .nth(i)
        .evaluate((element) =>
          element.scrollIntoView({ block: "center", behavior: "instant" }),
        );
      await page.waitForTimeout(200);
      assert.equal(
        await page
          .locator(".method-list li")
          .nth(i)
          .getAttribute("aria-current"),
        "step",
      );
    }
    assert.equal(
      await page
        .locator('.site-nav a[href="#method"]')
        .getAttribute("aria-current"),
      "location",
    );
  },
);
await check(
  "Command palette search, keyboard navigation and dismissal",
  async () => {
    await page.keyboard.press("Control+k");
    assert.equal(
      await page.locator(".command-dialog").evaluate((element) => element.open),
      true,
    );
    await page.locator("#command-search").fill("not-a-command");
    assert.equal(await page.locator(".command-empty").isVisible(), true);
    await page.locator("#command-search").fill("architecture");
    assert.equal(await page.locator(".command-results a:visible").count(), 1);
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await settle();
    assert.equal(
      await page.locator(".command-dialog").evaluate((element) => element.open),
      false,
    );
    assert.ok(page.url().endsWith("#architecture"));
    await page.locator("[data-command-open]").click();
    await accessibility("commands");
    await page.keyboard.press("Escape");
    assert.equal(
      await page
        .locator("[data-command-open]")
        .evaluate((element) => document.activeElement === element),
      true,
    );
  },
);

for (const width of [320, 375, 430, 768, 1024, 1440, 1920]) {
  await check(
    `Responsive layout ${width}px, images, navigation and screenshots`,
    async () => {
      await page.setViewportSize({ width, height: width < 680 ? 812 : 1000 });
      await goHome();
      for (const id of [
        "home",
        "architecture",
        "work",
        "expertise",
        "method",
        "contact",
      ]) {
        await page
          .locator(`#${id}`)
          .evaluate((element) =>
            element.scrollIntoView({ block: "start", behavior: "instant" }),
          );
        await page.waitForTimeout(700);
        const overflow = await page.evaluate(() => {
          const width = document.documentElement.clientWidth;
          return [...document.querySelectorAll("main *, header *, footer *")]
            .filter((element) => {
              if (
                getComputedStyle(element).position === "fixed" ||
                element.closest("svg") ||
                element.classList.contains("sr-only")
              )
                return false;
              const rect = element.getBoundingClientRect();
              return (
                rect.width > 0 && (rect.right > width + 1 || rect.left < -1)
              );
            })
            .map((element) => `${element.tagName}.${element.className}`)
            .slice(0, 12);
        });
        assert.deepEqual(overflow, [], `${id} overflows`);
        if (id === "home" || id === "architecture" || id === "expertise")
          await page.screenshot({
            path: `artifacts/verified-${width}-${id}.png`,
          });
      }
      const broken = await page
        .locator("main img")
        .evaluateAll((images) =>
          images
            .filter((image) => image.complete && image.naturalWidth === 0)
            .map((image) => image.src),
        );
      assert.deepEqual(broken, []);
      if (width <= 960) {
        await page.locator(".menu-toggle").click();
        assert.equal(await page.locator(".site-nav").isVisible(), true);
        await page.locator('.site-nav a[href="#work"]').click();
        await settle();
        assert.equal(
          await page.locator(".menu-toggle").getAttribute("aria-expanded"),
          "false",
        );
      }
      await page.locator('main .text-action[data-case="erp"]').click();
      await settle();
      assert.equal(
        await page
          .locator(".case-dialog")
          .evaluate(
            (element) => element.scrollWidth <= element.clientWidth + 1,
          ),
        true,
      );
      await page.keyboard.press("Escape");
      await settle();
      if (width === 320 || width === 768) await accessibility(`width-${width}`);
    },
  );
}
await check(
  "Touch-first architecture and menu; no enhanced cursor",
  async () => {
    const touch = await browser.newContext({
      viewport: { width: 375, height: 812 },
      isMobile: true,
      hasTouch: true,
    });
    const mobile = await touch.newPage();
    await mobile.goto(base, { waitUntil: "networkidle" });
    await mobile.locator('[data-node="ai"]').tap();
    assert.equal(
      await mobile.locator('[data-node="ai"]').getAttribute("aria-pressed"),
      "true",
    );
    assert.equal(
      await mobile
        .locator("html")
        .evaluate((element) => element.classList.contains("cursor-enabled")),
      false,
    );
    await mobile.locator(".menu-toggle").tap();
    await mobile.locator('.site-nav a[href="#contact"]').tap();
    assert.equal(
      await mobile.locator(".menu-toggle").getAttribute("aria-expanded"),
      "false",
    );
    await touch.close();
  },
);
await check(
  "Reduced motion, including preference changes at runtime",
  async () => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await goHome();
    await page.emulateMedia({ reducedMotion: "reduce" });
    assert.equal(
      await page
        .locator("html")
        .evaluate((element) => element.classList.contains("cursor-enabled")),
      false,
    );
    assert.equal(
      await page.evaluate(
        () =>
          document
            .getAnimations()
            .filter((animation) => animation.playState === "running").length,
      ),
      0,
    );
    await page.locator('main .text-action[data-case="erp"]').click();
    await page.waitForTimeout(150);
    assert.equal(
      await page.locator(".case-dialog").evaluate((element) => element.open),
      true,
    );
    await page.keyboard.press("Escape");
    await settle();
    await page.emulateMedia({ reducedMotion: "no-preference" });
  },
);
await check(
  "No-JavaScript content and navigation remain available",
  async () => {
    const noJS = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: 375, height: 812 },
    });
    const plain = await noJS.newPage();
    await plain.goto(base);
    assert.equal(await plain.locator("h1").isVisible(), true);
    assert.equal(await plain.locator(".site-nav").isVisible(), true);
    assert.equal(await plain.locator(".project-card").count(), 4);
    await noJS.close();
  },
);
await check("No console, runtime or failed-request errors", async () =>
  assert.deepEqual(errors, []),
);

await writeFile(
  "artifacts/verification.json",
  JSON.stringify(
    {
      passed: results.length,
      failed: failures.length,
      results,
      failures,
      errors,
    },
    null,
    2,
  ),
);
console.log(`\n${results.length} passed; ${failures.length} failed.`);
await browser.close();
if (failures.length) process.exitCode = 1;
