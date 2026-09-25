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
  const context = await browser.newContext({ viewport: { width: 1440, height: 700 } }), page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() === 404) errors.push(response.url()); });
  await page.goto(base + '/about', { waitUntil: 'networkidle' });
  assert.equal(await page.locator('video').evaluate(v => v.paused), true);
  assert.equal(await page.evaluate(() => performance.getEntriesByType('resource').some(r => r.name.endsWith('.mp4'))), false);
  await page.locator('.process-film-screen').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => { const v = document.querySelector('video'); return !v.paused && v.currentTime > .1; });
  assert.equal(await page.locator('video').evaluate(v => v.muted && v.loop && v.playsInline && !v.controls), true);
  assert.equal(await page.locator('.film-play').count(), 0);
  const tabs = page.getByRole('tablist', { name: 'Explore our process' });
  for (const title of ['Understand', 'Architect', 'Build', 'Evolve']) {
    await tabs.getByRole('tab', { name: new RegExp(title) }).click();
    await page.locator('.process-film-screen').scrollIntoViewIfNeeded();
    await page.waitForFunction(slug => {
      const v = document.querySelector('video');
      return v.currentSrc.endsWith('/' + slug + '.mp4') && v.readyState >= 2 && !v.paused && v.currentTime < 3;
    }, title.toLowerCase(), { timeout: 6000 });
    assert.ok(Math.abs(await page.locator('video').evaluate(v => v.duration) - 8) < .1);
    assert.equal(await tabs.getByRole('tab', { name: new RegExp(title) }).getAttribute('aria-selected'), 'true');
  }
  await page.locator('video').evaluate(v => { v.currentTime = 7.7; });
  await page.waitForFunction(() => document.querySelector('video').currentTime < 1);
  assert.match(await page.locator('video').getAttribute('src'), /evolve\.mp4$/);
  console.log('PASS four separate clips, automatic muted playback, instant selection, eight-second loops and no native controls');

  await page.getByRole('button', { name: 'Pause process animation', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('video').paused);
  await tabs.getByRole('tab', { name: /Understand/ }).focus(); await page.keyboard.press('ArrowRight');
  assert.equal(await tabs.getByRole('tab', { name: /Architect/ }).getAttribute('aria-selected'), 'true');
  assert.equal(await page.locator('video').evaluate(v => v.paused), true);
  await page.getByRole('button', { name: 'Play process animation', exact: true }).click();
  await page.locator('.process-film-screen').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => !document.querySelector('video').paused);
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
  await page.waitForFunction(() => document.querySelector('video').paused);
  await page.locator('.process-film-screen').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => !document.querySelector('video').paused);
  // Rapid changes must leave only the final scene playing.
  for (const index of [2, 0, 3, 1]) await tabs.getByRole('tab').nth(index).evaluate(button => button.click());
  await page.waitForFunction(() => { const v = document.querySelector('video'); return v.currentSrc.endsWith('/architect.mp4') && !v.paused; });
  assert.equal(await page.locator('video').count(), 1);
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.locator('.process-scenes').scrollIntoViewIfNeeded(); await page.waitForTimeout(800);
  await page.screenshot({ path: 'artifacts/process-scenes-desktop.png' });
  const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  assert.deepEqual(audit.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })), []);
  console.log('PASS keyboard tabs, persistent pause, visibility suspension, rapid switching and accessibility');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForFunction(() => document.querySelector('video').paused);
  await tabs.getByRole('tab', { name: /Build/ }).click();
  assert.equal(await page.locator('video').evaluate(v => v.paused), true);
  await page.getByRole('button', { name: 'Play process animation', exact: true }).click();
  await page.waitForFunction(() => !document.querySelector('video').paused);
  await page.getByRole('button', { name: 'Pause process animation', exact: true }).click();
  for (const width of [320, 375, 768, 1440]) {
    await page.setViewportSize({ width, height: 950 });
    await page.locator('.process-scenes').scrollIntoViewIfNeeded();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    if (width === 375) await page.screenshot({ path: 'artifacts/process-scenes-mobile.png' });
  }
  assert.deepEqual(errors, []);
  console.log('PASS reduced-motion posters, explicit playback override and four responsive widths');

  const plain = await browser.newContext({ javaScriptEnabled: false });
  const noJS = await plain.newPage(); await noJS.goto(base + '/about');
  assert.equal(await noJS.locator('video').evaluate(v => v.paused && !v.controls), true);
  await noJS.locator('.film-transcript summary').click();
  assert.equal(await noJS.locator('.film-transcript').evaluate(e => e.open), true);
  await plain.close();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.route('**/assets/film/understand.mp4', route => route.abort());
  await page.goto(base + '/about', { waitUntil: 'networkidle' });
  await page.locator('.process-film-screen').scrollIntoViewIfNeeded(); await page.locator('.film-error').waitFor();
  await page.getByRole('tab', { name: /Architect/ }).click();
  await page.locator('.process-film-screen').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => { const v = document.querySelector('video'); return v.currentSrc.endsWith('/architect.mp4') && !v.paused; });
  assert.equal(await page.locator('.film-error').count(), 0);
  console.log('PASS static content without JavaScript and recovery by selecting another scene after a media error');
} finally { await browser.close(); await new Promise(done => server.close(done)); }
