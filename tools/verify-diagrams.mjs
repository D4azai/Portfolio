import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { previewServer } from '../server/local.js';

await mkdir('artifacts/diagrams', { recursive: true });
const server = previewServer({ root: resolve('dist') });
await new Promise(done => server.listen(0, '127.0.0.1', done));
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage(), errors = [];
page.on('pageerror', error => errors.push(error.message));
const base = `http://127.0.0.1:${server.address().port}`;
async function select(index) {
  await page.locator(`#step-${index}`).click();
  await page.locator('.diagram-playground').scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
}
async function capture(name) {
  await page.waitForTimeout(700);
  await page.locator('.diagram-playground').screenshot({ path: `artifacts/diagrams/${name}.png` });
  const { violations } = await new AxeBuilder({ page }).include('#method').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  assert.deepEqual(violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })), [], name);
}
try {
  await page.goto(base + '/#method', { waitUntil: 'networkidle' });
  await select(0);
  const node = page.locator('.discovery-node').first();
  const pathBefore = await page.locator('.discovery-links g path').first().getAttribute('d');
  const bounds = await node.boundingBox();
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.mouse.down(); await page.mouse.move(bounds.x + bounds.width / 2 + 60, bounds.y + bounds.height / 2 + 35, { steps: 12 }); await page.mouse.up();
  assert.notEqual(await page.locator('.discovery-links g path').first().getAttribute('d'), pathBefore);
  assert.equal(await page.locator('.discovery-field').getAttribute('data-dragging'), 'false');
  await page.getByRole('button', { name: 'Reset map' }).click();
  assert.equal(await page.locator('.discovery-links g path').first().getAttribute('d'), pathBefore);
  await node.focus(); await page.keyboard.press('ArrowRight');
  assert.equal(await node.evaluate(element => element.style.left), '27%');
  await page.locator('.discovery-node').nth(1).click();
  assert.match(await page.locator('.diagram-insight').innerText(), /Workflows reveal/);
  await capture('01-discovery');
  console.log('PASS discovery mouse dragging, live connections, keyboard movement and reset');

  await select(1);
  const top = await page.locator('.architecture-layer-0').evaluate(el => getComputedStyle(el).top);
  await page.locator('#layer-spacing').focus(); await page.keyboard.press('End'); await page.waitForTimeout(500);
  assert.equal(await page.locator('#layer-spacing').inputValue(), '100');
  assert.notEqual(await page.locator('.architecture-layer-0').evaluate(el => getComputedStyle(el).top), top);
  for (const i of [0,1,2]) { await page.locator(`.architecture-layer-${i}`).click(); assert.equal(await page.locator(`.architecture-layer-${i}`).getAttribute('aria-pressed'), 'true'); }
  await page.getByRole('button', { name: 'Disconnect bridges' }).click();
  assert.equal(await page.locator('.architecture-field').getAttribute('data-connected'), 'false');
  assert.match(await page.locator('.diagram-insight').innerText(), /isolated/);
  await page.getByRole('button', { name: 'Connect bridges' }).click();
  await capture('02-architecture');
  console.log('PASS architecture layer separation, selection and integration bridge toggle');

  await select(2);
  await page.getByRole('button', { name: 'Run build' }).click();
  await page.getByRole('button', { name: 'Pause diagram animation', exact: true }).click();
  const progress = await page.locator('.build-result strong').innerText();
  await page.waitForTimeout(1300);
  assert.equal(await page.locator('.build-result strong').innerText(), progress);
  await page.getByRole('button', { name: 'Resume diagram animation', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('.build-result strong').textContent === '100%');
  assert.equal(await page.locator('.build-stage[data-complete=true]').count(), 3);
  await page.getByRole('button', { name: 'Run again' }).click();
  await page.getByRole('button', { name: 'Stop demo' }).click();
  const stopped = await page.locator('.build-result strong').innerText(); await page.waitForTimeout(1100);
  assert.equal(await page.locator('.build-result strong').innerText(), stopped);
  await capture('03-build');
  console.log('PASS build sequence, completion, pause/resume, replay and stop');

  await select(3);
  const dial = page.getByRole('slider', { name: 'Feedback orbit' });
  const rect = await dial.boundingBox();
  await page.mouse.move(rect.x + rect.width - 12, rect.y + rect.height / 2);
  await page.mouse.down(); await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height - 8, { steps: 15 }); await page.mouse.up();
  assert.ok(Number(await dial.getAttribute('aria-valuenow')) > 120);
  await dial.focus(); await page.keyboard.press('Home'); await page.keyboard.press('PageUp');
  assert.equal(await dial.getAttribute('aria-valuenow'), '120');
  assert.match(await dial.getAttribute('aria-valuetext'), /Observe/);
  await page.locator('.evolution-stop').nth(2).click(); assert.equal(await dial.getAttribute('aria-valuenow'), '240');
  await page.getByRole('button', { name: 'Next iteration' }).click();
  assert.match(await dial.getAttribute('aria-valuetext'), /Release, cycle 2/);
  await capture('04-evolution');
  console.log('PASS orbital dragging, keyboard dial, phase selection and next iteration');

  for (const width of [320,390,768]) {
    await page.setViewportSize({ width, height: 950 });
    for (let i = 0; i < 4; i++) {
      await select(i);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), `${width}px step ${i}`);
      const controls = page.locator('.diagram-playground button');
      for (const button of await controls.all()) {
        const box = await button.boundingBox();
        assert.ok(box.x >= 0 && box.x + box.width <= width, `Control within ${width}px step ${i}`);
      }
      if (width === 390) await capture(`mobile-${i}`);
    }
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await select(2); await page.getByRole('button', { name: 'Run build' }).click();
  await page.waitForFunction(() => document.querySelector('.build-result strong').textContent === '100%');
  assert.equal(await page.locator('.scene-surface').evaluate(el => getComputedStyle(el).transform), 'none');
  await select(0); await node.focus(); await page.keyboard.press('ArrowRight');
  assert.equal(await node.evaluate(el => el.style.left), '27%');
  const touch = await browser.newContext({ viewport: { width: 390, height: 900 }, hasTouch: true, isMobile: true });
  const mobile = await touch.newPage(); await mobile.goto(base + '/#method');
  await mobile.locator('.discovery-node').nth(2).tap();
  assert.equal(await mobile.locator('.discovery-node').nth(2).getAttribute('aria-pressed'), 'true');
  await mobile.locator('#step-3').tap(); await mobile.locator('.evolution-stop').nth(1).tap();
  assert.match(await mobile.getByRole('slider').getAttribute('aria-valuetext'), /Observe/);
  await touch.close();
  assert.deepEqual(errors, []);
  await writeFile('artifacts/diagrams/result.json', JSON.stringify({ passed: true, widths: [320,390,768,1440], errors }, null, 2));
  console.log('PASS all scenes responsive, accessible, touch-operable and usable with reduced motion');
} finally { await browser.close(); await new Promise(done => { server.close(done); server.closeAllConnections(); }); }
