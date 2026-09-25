import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { previewServer } from '../server/local.js';

const server = previewServer({ root: resolve('dist') });
await new Promise(done => server.listen(0, '127.0.0.1', done));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1050 } });
  const page = await context.newPage();
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto(base + '/#home', { waitUntil: 'networkidle' });
  await page.waitForSelector('.hero-art .hologram-ready');
  await page.getByRole('button', { name: 'Say hello' }).click();
  await page.waitForFunction(() => document.querySelector('.hero-art .hologram-viewport').dataset.gesture === 'wave');
  await page.waitForTimeout(1300);
  await page.screenshot({ path: 'artifacts/enhanced-robot.png' });
  await page.getByRole('button', { name: 'Pause character animation' }).click();
  assert.equal(await page.getByRole('button', { name: 'Say hello' }).isDisabled(), true);
  const frame = await page.locator('.hero-art .hologram-viewport').getAttribute('data-frame');
  await page.waitForTimeout(150);
  assert.equal(await page.locator('.hero-art .hologram-viewport').getAttribute('data-frame'), frame);
  console.log('PASS articulated greeting and pause');

  await page.getByRole('button', { name: 'Pause background motion' }).click();
  assert.equal(await page.locator('.ambient-field').getAttribute('data-motion'), 'paused');
  await page.goto(base + '/expertise', { waitUntil: 'networkidle' });
  assert.equal(await page.locator('.ambient-field').getAttribute('data-motion'), 'paused');
  await page.getByRole('button', { name: 'Resume background motion' }).click();
  await page.waitForFunction(() => document.querySelector('.ambient-field').dataset.motion === 'running');
  console.log('PASS background pause persists across pages');

  await page.locator('.system-lab').scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: 'Connected operations', exact: true }).click();
  assert.match(await page.locator('.system-journey ol').innerText(), /Automation/);
  assert.doesNotMatch(await page.locator('.system-journey ol').innerText(), /Interface/);
  const automation = page.locator('.system-graph-node').filter({ hasText: 'Automation' });
  await automation.focus(); await page.keyboard.press('Enter');
  assert.equal(await automation.getAttribute('aria-pressed'), 'true');
  assert.match(await page.locator('.system-node-detail').innerText(), /Routine handoffs/);
  await page.getByRole('button', { name: 'Animate signal flow' }).click();
  assert.equal(await page.locator('.system-graph svg:visible g[data-active=true]').count(), 3);
  await page.waitForFunction(() => document.querySelector('.system-graph').getAnimations({ subtree: true }).some(a => a.playState === 'running'));
  await page.screenshot({ path: 'artifacts/enhanced-system-graph.png' });
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForFunction(() => document.querySelector('.system-graph').getAnimations({ subtree: true }).every(a => a.playState !== 'running'));
  await page.locator('.system-lab').scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: 'Pause signal flow' }).click();
  assert.equal(await page.locator('.system-graph').evaluate(e => e.getAnimations({ subtree: true }).length), 0);
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  assert.deepEqual(violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })), []);
  console.log('PASS graph journeys, keyboard selection, signal controls, offscreen suspension and accessibility');

  for (const width of [320, 375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.locator('.system-graph').scrollIntoViewIfNeeded();
    const boxes = await page.locator('.system-graph-node').evaluateAll(nodes => nodes.map(node => { const r = node.getBoundingClientRect(); return { x: r.x, y: r.y, right: r.right, bottom: r.bottom }; }));
    for (const [index, box] of boxes.entries()) {
      assert.ok(box.x >= 0 && box.right <= width, 'Graph node fits viewport');
      for (const other of boxes.slice(index + 1)) assert.ok(box.right <= other.x || other.right <= box.x || box.bottom <= other.y || other.bottom <= box.y, 'Graph nodes do not overlap');
    }
    if (width === 375) await page.screenshot({ path: 'artifacts/enhanced-system-mobile.png' });
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('button', { name: 'Animate signal flow' }).click();
  assert.equal(await page.locator('.ambient-field').getAttribute('data-motion'), 'paused');
  assert.equal(await page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running').length), 0);
  assert.deepEqual(errors, []);
  console.log('PASS graph at four widths, live reduced motion and browser errors');
} finally { await browser.close(); await new Promise(done => server.close(done)); }
