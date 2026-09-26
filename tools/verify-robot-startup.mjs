import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { previewServer } from '../server/local.js';
const server = previewServer({ root: resolve('dist') });
await new Promise(done => server.listen(0, '127.0.0.1', done));
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const base = `http://127.0.0.1:${server.address().port}`;
try {
 for (const reducedMotion of ['no-preference', 'reduce']) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion });
  const page = await context.newPage(), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base);
  const intro = page.locator('.intro-robot .hologram-viewport');
  await page.waitForSelector('.intro-robot .hologram-ready');
  assert.equal(await intro.getAttribute('data-power'), 'off');
  assert.equal(await intro.getAttribute('data-head-tilt'), '0.500');
  const frame = await intro.getAttribute('data-frame');
  await page.mouse.move(1100, 300); await page.waitForTimeout(250);
  assert.equal(await intro.getAttribute('data-frame'), frame);
  assert.equal(await intro.getAttribute('data-motion'), 'paused');
  await page.waitForSelector('.hero-art .hologram-ready', { state: 'attached' });
  assert.equal(await page.locator('.hero-art .hologram-viewport').getAttribute('data-power'), 'off');
  await page.getByRole('button', { name: 'Enter portfolio', exact: true }).click();
  if (reducedMotion === 'no-preference') {
   await page.waitForTimeout(1100);
   assert.equal(await intro.getAttribute('data-power'), 'off');
   assert.equal(await page.locator('.intro-dialog').count(), 1);
  }
  if (reducedMotion === 'no-preference') {
   await page.waitForSelector('.intro-revealing');
   assert.equal(await page.locator('.hero-art .hologram-ready').count(), 1);
   assert.equal(await page.locator('.intro-boot-overlay').evaluate(el => getComputedStyle(el).opacity), '1');
   assert.equal(await page.locator('.intro-shell').evaluate(el => getComputedStyle(el).opacity), '0');
  }
  await page.locator('.intro-dialog').waitFor({ state: 'detached' });
  const hero = page.locator('.hero-art .hologram-viewport');
  await page.waitForSelector('.hero-art .hologram-ready');
  if (reducedMotion === 'no-preference') {
   await page.waitForFunction(() => document.querySelector('.hero-art .hologram-viewport').dataset.power === 'waking');
  }
  await page.waitForFunction(() => document.querySelector('.hero-art .hologram-viewport').dataset.power === 'on');
  assert.ok(Math.abs(Number(await hero.getAttribute('data-head-tilt'))) < .2);
  assert.equal(await hero.getAttribute('data-motion'), reducedMotion === 'reduce' ? 'paused' : 'running');
  await page.getByRole('button', { name: 'Replay the introduction' }).click();
  await page.waitForSelector('.intro-robot .hologram-ready');
  assert.equal(await intro.getAttribute('data-power'), 'off');
  await page.getByRole('button', { name: 'Skip intro' }).click();
  await page.locator('.intro-dialog').waitFor({ state: 'detached' });
  await hero.scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector('.hero-art .hologram-viewport').dataset.power === 'on');
  await page.route('**/assets/app.js', async route => { await new Promise(resolve => setTimeout(resolve, 500)); await route.continue(); });
  await page.reload({ waitUntil: 'commit' });
  await page.waitForFunction(() => document.documentElement.classList.contains('intro-seen'));
  assert.equal(await page.locator('.intro-dialog:visible').count(), 0);
  await page.waitForSelector('.hero-art .hologram-ready');
  assert.equal(await page.locator('.intro-dialog').count(), 0);
  await page.locator('.hero-art').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector('.hero-art .hologram-viewport').dataset.power === 'on');
  assert.deepEqual(errors, []);
  await context.close();
  console.log(`PASS ${reducedMotion}: standby, terminal ordering, startup, seamless reveal, replay, skip and refresh`);
 }
} finally {
 await browser.close();
 server.closeAllConnections();
 await new Promise(done => server.close(done));
}
