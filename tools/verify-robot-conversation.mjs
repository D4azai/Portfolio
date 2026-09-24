import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { previewServer } from '../server/local.js';

await mkdir('artifacts', { recursive: true });
const server = previewServer({ root: resolve('dist') });
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
await page.addInitScript(() => {
  sessionStorage.setItem('aynko:intro-seen', '1');
  window.__spoken = [];
  Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: {
    getVoices: () => [], cancel: () => { window.__cancelled = true; },
    speak: utterance => { window.__spoken.push(utterance.text); setTimeout(() => utterance.onstart?.(), 0); },
  } });
  window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
});
let pending = null, history = null;
await page.route('**/api/chat', async route => {
  if (route.request().method() === 'GET') return route.fulfill({ json: { available: true } });
  history = route.request().postDataJSON().messages;
  pending = route;
});
async function answer(reply) {
  await page.waitForFunction(() => document.querySelector('.chat-thinking'));
  for (let i = 0; !pending && i < 30; i++) await page.waitForTimeout(50);
  assert.ok(pending, 'Chat request reached the server');
  const route = pending; pending = null;
  await route.fulfill({ json: { reply } });
  await page.locator('.chat-assistant').last().waitFor();
}
try {
  await page.goto(`http://127.0.0.1:${server.address().port}`, { waitUntil: 'networkidle' });
  await page.locator('.hero-art canvas').waitFor();
  for (const layer of ['data','flow','ai','edge']) {
    const button = page.locator('.layer-button').filter({ hasText: new RegExp(layer, 'i') });
    await button.click();
    assert.equal(await page.locator('.hero-art .hologram-viewport').getAttribute('data-gesture'), layer);
    const count = await page.locator('.hero-art .hologram-stage').getAttribute('data-action');
    await button.click();
    assert.equal(Number(await page.locator('.hero-art .hologram-stage').getAttribute('data-action')), Number(count) + 1);
  }
  console.log('PASS Four distinct robot actions and repeat-click replay');
  await page.locator('.chat-toggle').click();
  await page.locator('#robot-question').fill('Can you explain the construction ERP?');
  await page.getByRole('button', { name: 'Send question', exact: true }).click();
  assert.equal(await page.locator('.hero-art .hologram-stage').getAttribute('data-phase'), 'thinking');
  await answer('The construction ERP connects project workflows and is in user acceptance testing.');
  await page.waitForFunction(() => document.querySelector('.hero-art .hologram-stage').dataset.phase === 'responding');
  assert.equal(history[0].content, 'Can you explain the construction ERP?');
  console.log('PASS Question-dependent chat and visible response reaction');
  await page.getByRole('button', { name: 'Voice off', exact: true }).click();
  await page.locator('#robot-question').fill('And who built it?');
  await page.getByRole('button', { name: 'Send question', exact: true }).click();
  await answer('Aymane Chellak and Zakaria Bak are the people behind AYNKO.');
  await page.waitForFunction(() => document.querySelector('.hero-art .hologram-stage').dataset.phase === 'speaking');
  assert.equal(history.length, 3);
  assert.equal((await page.evaluate(() => window.__spoken))[0], 'Aymane Chellak and Zakaria Bak are the people behind AYNKO.');
  await page.getByRole('button', { name: 'Stop voice', exact: true }).click();
  assert.equal(await page.locator('.hero-art .hologram-stage').getAttribute('data-phase'), 'idle');
  assert.equal(await page.evaluate(() => window.__cancelled), true);
  console.log('PASS Follow-up context, opt-in speech, mouth reaction and voice cancellation');
  const { violations } = await new AxeBuilder({ page }).include('.hero-art').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  await writeFile('artifacts/robot-chat-axe.json', JSON.stringify(violations, null, 2));
  assert.deepEqual(violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) })), []);
  await page.locator('#home').screenshot({ path: 'artifacts/upgrade-hero-chat.png' });
  await page.locator('#robot-question').fill('This response should be cancelled.');
  await page.getByRole('button', { name: 'Send question', exact: true }).click();
  await page.locator('.chat-thinking').waitFor();
  await page.locator('.chat-toggle').click();
  await page.waitForTimeout(100);
  if (pending) { await pending.fulfill({ json: { reply: 'Late response must not speak.' } }).catch(() => {}); pending = null; }
  await page.waitForTimeout(150);
  assert.equal(await page.locator('.hero-art .hologram-stage').getAttribute('data-phase'), 'idle');
  assert.equal((await page.evaluate(() => window.__spoken)).length, 1);
  console.log('PASS Closing chat cancels requests and blocks late speech');
  await page.locator('#method').scrollIntoViewIfNeeded();
  await page.locator('#process-panel').screenshot({ path: 'artifacts/upgrade-diagram.png' });
  await page.getByRole('button', { name: 'Pause diagram animation', exact: true }).click();
  assert.equal(await page.locator('.diagram-3d').getAttribute('data-paused'), 'true');
  await page.locator('#work').scrollIntoViewIfNeeded();
  await page.locator('.showcase-panel:not([hidden]) .project-cover-photo img').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => { const image = document.querySelector('.showcase-panel:not([hidden]) .project-cover-photo img'); return image?.complete && image.naturalWidth > 0; });
  await page.waitForTimeout(1200);
  await page.locator('.showcase-panel:not([hidden])').screenshot({ path: 'artifacts/upgrade-project-cover.png' });
  assert.equal(await page.locator('.showcase-browser').count(), 0);
  for (const width of [320,390,768]) {
    await page.setViewportSize({ width, height: 900 });
    await page.locator('#home').scrollIntoViewIfNeeded();
    if (await page.locator('.chat-toggle').getAttribute('aria-expanded') === 'false') await page.locator('.chat-toggle').click();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), `No overflow at ${width}px`);
  }
  await page.locator('.hero-art').screenshot({ path: 'artifacts/upgrade-mobile-chat.png' });
  assert.deepEqual(errors, []);
  console.log('PASS Diagram pause, photo covers, accessibility and responsive chat');
} finally {
  await browser.close();
  await new Promise(resolve => { server.close(resolve); server.closeAllConnections(); });
}
