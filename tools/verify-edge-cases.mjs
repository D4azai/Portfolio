import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
try {
  await page.goto('http://127.0.0.1:4173/#case/__proto__', { waitUntil: 'networkidle' });
  await page.locator('main .text-action[data-case="affiliate"]').evaluate(link => {
    link.click();
    history.back();
  });
  await page.waitForTimeout(900);
  const state = await page.evaluate(() => ({ hash: location.hash, title: document.title, overflow: document.body.style.overflow, open: document.querySelector('.case-dialog').open }));
  console.log('Interrupted transition:', state);
  assert.equal(state.open, false);
  assert.equal(state.overflow, '');
  assert.equal(state.title, 'AYNKO — Software Engineer & Systems Architect');
  await page.locator('main .text-action[data-case="crm"]').click();
  await page.waitForTimeout(700);
  assert.equal(await page.locator('#case-title').innerText(), 'CRM');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(700);
  await page.keyboard.press('Control+k');
  await page.keyboard.press('ArrowUp');
  assert.equal(await page.evaluate(() => document.activeElement.getAttribute('href')), 'mailto:aymane.chellak@outlook.fr');
  await page.locator('#command-search').fill('architecture');
  await page.locator('#command-search').focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(700);
  assert.equal(await page.evaluate(() => document.activeElement.id), 'architecture');
  assert.equal(await page.evaluate(() => document.body.style.overflow), '');
  assert.deepEqual(errors, []);
  console.log('PASS interrupted routing, subsequent cases, reverse palette navigation, destination focus, no runtime errors');
} finally {
  await browser.close();
}
