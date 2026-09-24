import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { previewServer } from '../server/local.js';
import { createApp } from '../server/app.js';
import { resolve } from 'node:path';

await mkdir('artifacts', { recursive: true });
const server = previewServer({ root: resolve('dist'), app: createApp({ env: {} }) });
await new Promise(done => server.listen(0, '127.0.0.1', done));
const base = 'http://127.0.0.1:' + server.address().port;
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const results = [], failures = [], errors = [];
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
page.setDefaultTimeout(15000);
page.on('pageerror', e => errors.push(e.message));
page.on('console', message => { if (message.type() === 'error' && /hydration|Minified React/.test(message.text())) errors.push(message.text()); });
page.on('response', r => { if (r.status() === 404) errors.push('Missing: ' + r.url()); });
async function check(name, test) { try { await test(); results.push(name); console.log('PASS', name); } catch(e) { failures.push({ name, error:e.stack }); console.error('FAIL', name, e.message); } }
async function audit(label) {
  await page.waitForTimeout(800);
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  await writeFile('artifacts/react-axe-' + label + '.json', JSON.stringify(violations, null, 2));
  assert.deepEqual(violations.map(v => ({ id:v.id, targets:v.nodes.map(n => n.target) })), []);
}
async function enter(p = page) {
  await p.getByRole('button', {name:'Enter portfolio', exact:true}).click();
  await p.waitForSelector('.intro-dialog', {state:'detached'});
}
const frame = (p, selector) => p.locator(selector).getAttribute('data-frame');
try {
  await page.goto(base, {waitUntil:'networkidle'});
  await check('Intro loads assets, stays open at 100%, traps focus, and has accessible controls', async () => {
    await page.waitForSelector('html.react-ready');
    await page.waitForFunction(() => document.querySelector('.intro-progress').getAttribute('aria-valuenow') === '100');
    await page.waitForTimeout(6000);
    assert.ok(await page.locator('.intro-dialog').evaluate(e => e.open));
    assert.equal(await page.evaluate(() => document.body.style.overflow), 'hidden');
    await page.keyboard.press('Tab');
    assert.ok(await page.evaluate(() => document.querySelector('.intro-dialog').contains(document.activeElement)));
    assert.equal(await page.locator('h1').count(), 1);
    assert.ok(await page.evaluate(() => document.fonts.check('500 16px Manrope')));
    assert.deepEqual(await page.evaluate(() => performance.getEntriesByType('resource').filter(r => !r.name.startsWith(location.origin)).map(r => r.name)), []);
    await audit('intro-desktop');
    await page.screenshot({path:'artifacts/react-intro-desktop.png'});
    await enter();
    assert.equal(await page.evaluate(() => document.body.style.overflow), '');
    assert.ok(await page.locator('#main').evaluate(e => e === document.activeElement));
    await page.waitForTimeout(1000);
    await page.screenshot({path:'artifacts/react-desktop-hero.png'});
  });
  await check('A repeat visit in the same session skips the intro; people and profiles are linked', async () => {
    await page.goto(base, {waitUntil:'networkidle'});
    await page.waitForSelector('html.react-ready');
    await page.waitForTimeout(300);
    assert.equal(await page.locator('.intro-dialog').count(), 0);
    assert.ok(await page.locator('html').evaluate(e => e.classList.contains('experience-entered')));
    assert.equal(await page.evaluate(() => document.body.style.overflow), '');
    await page.waitForSelector('.hero-art .hologram-ready');
    assert.ok(await page.locator('a[href="mailto:Zakariasurface@outlook.com"]').count() >= 2);
    assert.ok(await page.locator('footer a[href^="https://www.linkedin.com/"]').count());
    assert.equal(await page.locator('.project-showcase').isVisible(), true);
  });
  await check('Cursor follows mouse, reacts to links, attracts buttons and yields to keyboard', async () => {
    const button = page.locator('.hero-actions .action');
    const bounds = await button.boundingBox();
    await page.mouse.move(bounds.x + bounds.width - 12, bounds.y + bounds.height / 2, {steps:5});
    await page.waitForTimeout(250);
    assert.ok(await page.locator('html').evaluate(e => e.classList.contains('cursor-active')));
    assert.equal(await page.locator('.experience-cursor').getAttribute('data-mode'), 'link');
    assert.notEqual(await button.evaluate(e => e.style.getPropertyValue('--magnet-x')), '');
    const position = await page.locator('.cursor-ring').evaluate(e => e.style.transform);
    await page.mouse.move(450, 170, {steps:5}); await page.waitForTimeout(250);
    assert.notEqual(await page.locator('.cursor-ring').evaluate(e => e.style.transform), position);
    await page.keyboard.press('Tab');
    assert.equal(await page.locator('html').evaluate(e => e.classList.contains('cursor-active')), false);
    assert.equal(await button.evaluate(e => e.style.getPropertyValue('--magnet-x')), '');
  });
  await check('Robot renders and animates; pause, resume, pointer response and offscreen suspension work', async () => {
    const host = '.hero-art .hologram-viewport';
    await page.waitForSelector('.hero-art .hologram-ready');
    assert.equal(await page.locator('.hero-art canvas').count(), 1);
    const initial = await frame(page, host);
    await page.waitForTimeout(200);
    assert.notEqual(await frame(page, host), initial);
    await page.locator('.hero-art').getByRole('button', {name:'Pause character animation'}).click();
    const paused = await frame(page, host);
    await page.waitForTimeout(200);
    assert.equal(await frame(page, host), paused);
    assert.equal(await page.locator(host).getAttribute('data-motion'), 'paused');
    await page.locator('.hero-art').getByRole('button', {name:'Resume character animation'}).click();
    const before = await page.locator('.hero-art canvas').screenshot();
    await page.locator(host).hover({position:{x:35,y:80}});
    await page.waitForTimeout(250);
    assert.notDeepEqual(await page.locator('.hero-art canvas').screenshot(), before);
    await page.locator('#contact').evaluate(e => e.scrollIntoView({behavior:'instant'}));
    await page.waitForFunction(() => document.querySelector('.hero-art .hologram-viewport').dataset.motion === 'paused');
    await page.locator('#home').evaluate(e => e.scrollIntoView({behavior:'instant'}));
  });
  await check('All four layers respond and their detail dialogs restore focus', async () => {
    for (const key of ['data','flow','ai','edge']) {
      await page.locator('.layer-button').filter({hasText:new RegExp(key,'i')}).click();
      assert.equal(await page.locator('.hero-art .hologram-stage').getAttribute('data-layer'), key);
      const trigger = page.locator('[data-pillar="' + key + '"]');
      await trigger.click();
      assert.ok(await page.locator('.pillar-dialog').evaluate(e => e.open));
      await page.keyboard.press('Escape');
      assert.ok(await trigger.evaluate(e => e === document.activeElement));
    }
  });
  await check('Projects are visible immediately; selector, keyboard, cases and galleries work', async () => {
    await page.locator('#work').evaluate(e => e.scrollIntoView({behavior:'instant'}));
    await page.locator('.project-showcase').waitFor({state:'visible'});
    const tabs = page.getByRole('tablist', {name:'Choose a project'});
    await tabs.getByRole('tab').first().focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('#project-tab-studioNorth').getAttribute('aria-selected'), 'true');
    await page.keyboard.press('End');
    assert.equal(await page.locator('#project-tab-northstar').getAttribute('aria-selected'), 'true');
    await page.getByRole('button', {name:'Next project', exact:true}).click();
    assert.equal(await page.locator('#project-tab-affiliate').getAttribute('aria-selected'), 'true');
    await page.getByRole('button', {name:'Previous project', exact:true}).click();
    assert.equal(await page.locator('#project-tab-northstar').getAttribute('aria-selected'), 'true');
    for (const key of ['affiliate','studioNorth','erp','crm','northstar']) {
      await page.locator('#project-tab-' + key).click();
      assert.equal(await page.locator('.showcase-panel:not([hidden])').count(), 1);
      const panel = page.locator('#project-panel-' + key);
      if (await panel.locator('img').count()) await panel.locator('img').evaluate(e => e.decode());
      const trigger = panel.locator('[data-case]');
      await trigger.click();
      assert.ok(await page.locator('.case-dialog').evaluate(e => e.open));
      if (key === 'erp') {
        await page.getByRole('button', {name:'02 / Material request workflow'}).click();
        assert.match(await page.locator('.gallery figcaption').innerText(), /Material request/);
        await audit('case');
      }
      await page.keyboard.press('Escape');
      assert.ok(await trigger.evaluate(e => e === document.activeElement));
    }
    await page.locator('#project-tab-affiliate').click();
    await page.locator('[data-explore-case="affiliate"]').click();
    assert.ok(await page.locator('.case-dialog').evaluate(e => e.open));
    await page.keyboard.press('Escape');
  });
  await check('Project lighting, depth, cursor labels and rapid transitions settle correctly', async () => {
    const visual = page.locator('[data-explore-case="affiliate"]');
    await visual.scrollIntoViewIfNeeded();
    await visual.hover({position:{x:60,y:110}});
    await page.waitForTimeout(400);
    assert.equal(await page.locator('.cursor-label').innerText(), 'VIEW PROJECT');
    assert.equal(await visual.getAttribute('data-pointer-active'), 'true');
    assert.notEqual(await visual.evaluate(e => e.style.getPropertyValue('--tilt-y')), '0.00deg');
    assert.notEqual(await visual.locator('.project-depth').evaluate(e => getComputedStyle(e).transform), 'none');
    assert.equal(await visual.locator('.project-atmosphere svg').count(), 1);
    await page.screenshot({path:'artifacts/effects-project-hover.png'});
    await visual.click();
    await page.waitForTimeout(100);
    assert.equal(await page.locator('html').evaluate(e => e.classList.contains('cursor-active')), false);
    await page.keyboard.press('Escape');
    // Interrupt transitions before they finish; only the final selection stays exposed.
    for (const id of ['crm','erp','northstar','studioNorth']) {
      await page.locator('#project-tab-' + id).evaluate(e => e.click());
      await page.waitForTimeout(60);
    }
    await page.waitForFunction(() => document.querySelector('.showcase-stage').getAnimations({subtree:true}).every(a => a.playState !== 'running'));
    assert.equal(await page.locator('.showcase-panel:not([hidden])').getAttribute('id'), 'project-panel-studioNorth');
    assert.equal(await page.locator('.showcase-stage').evaluate(e => e.getAnimations({subtree:true}).filter(a => a.playState === 'running').length), 0);
    await page.locator('#project-tab-affiliate').click();
  });
  await check('Process tabs support arrows, Home and End', async () => {
    await page.locator('#step-0').focus(); await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('#step-1').getAttribute('aria-selected'), 'true');
    assert.match(await page.locator('#process-panel').innerText(), /blueprint/);
    await page.keyboard.press('End'); assert.equal(await page.locator('#step-3').getAttribute('aria-selected'), 'true');
    await page.keyboard.press('Home'); assert.equal(await page.locator('#step-0').getAttribute('aria-selected'), 'true');
  });
  await check('Eight responsive widths fit; desktop and mobile pass automated WCAG checks', async () => {
    for (const width of [320,375,430,768,1024,1280,1440,1920]) {
      await page.setViewportSize({width,height:1000});
      for (const id of ['home','work','expertise','method','about','faq','contact']) {
        await page.locator('#' + id).evaluate(e => e.scrollIntoView({behavior:'instant'}));
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Overflow: ' + width + '/' + id);
      }
      if ([375,1440].includes(width)) await audit('page-' + width);
    }
    await page.setViewportSize({width:1440,height:1000});
    for (const id of ['work','expertise','method','about','contact']) {
      await page.locator('#' + id).evaluate(e => e.scrollIntoView({behavior:'instant'}));
      await page.waitForTimeout(800);
      await page.screenshot({path:'artifacts/react-' + id + '.png'});
    }
  });
  await check('Mobile intro, menu, FAQ and enquiry fallback remain usable', async () => {
    await page.setViewportSize({width:375,height:812});
    await page.evaluate(() => sessionStorage.clear());
    await page.goto(base, {waitUntil:'networkidle'});
    await audit('intro-mobile');
    await page.screenshot({path:'artifacts/react-intro-mobile.png'});
    const enterBounds = await page.getByRole('button', {name:'Enter portfolio',exact:true}).boundingBox();
    assert.ok(enterBounds.y + enterBounds.height < 812, 'Entry must be reachable without scrolling');
    await enter();
    await page.waitForTimeout(900);
    await page.screenshot({path:'artifacts/react-mobile-hero.png'});
    await page.locator('.mobile-nav summary').click(); await audit('menu');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.mobile-nav').evaluate(e => e.open), false);
    await page.locator('.mobile-nav summary').click();
    await page.getByRole('navigation', {name:'Mobile navigation'}).getByText('About').click();
    assert.equal(await page.locator('.mobile-nav').evaluate(e => e.open), false);
    await page.locator('.faq-item summary').first().click();
    assert.equal(await page.locator('.faq-item').first().evaluate(e => e.open), true);
    await page.locator('[data-contact]').click();
    assert.ok(await page.locator('#contact-dialog').evaluate(e => e.open));
    await page.waitForFunction(() => document.querySelector('[data-form-status]').textContent.length > 0);
    assert.equal(await page.locator('.signal-success').isVisible(), false);
    await audit('contact'); await page.keyboard.press('Escape');
    assert.ok(await page.locator('[data-contact]').evaluate(e => e === document.activeElement));
  });
  await check('Replay, Escape, Skip and repeated entry restore scroll and focus', async () => {
    for (const mode of ['Escape','Skip','Enter']) {
      await page.getByRole('button', {name:/Replay the introduction/}).click();
      await page.waitForSelector('.intro-dialog[open]');
      if (mode === 'Escape') await page.keyboard.press('Escape');
      else if (mode === 'Skip') await page.getByRole('button',{name:'Skip intro'}).click();
      else await page.getByRole('button',{name:'Enter portfolio',exact:true}).click();
      await page.waitForSelector('.intro-dialog',{state:'detached'});
      assert.ok(await page.locator('.replay-intro').evaluate(e => e === document.activeElement));
      assert.equal(await page.evaluate(() => document.body.style.overflow), '');
    }
  });
  await check('Reduced motion works on arrival and when changed live', async () => {
    const reduced = await browser.newContext({reducedMotion:'reduce'});
    const p = await reduced.newPage();
    try {
      await p.goto(base,{waitUntil:'networkidle'});
      await p.waitForSelector('.intro-dialog .hologram-ready');
      assert.equal(await p.evaluate(() => document.getAnimations().filter(a => a.playState === 'running').length), 0);
      assert.equal(await p.locator('.intro-dialog .hologram-viewport').getAttribute('data-motion'), 'paused');
      await enter(p);
      await p.emulateMedia({reducedMotion:'no-preference'});
      await p.waitForFunction(() => document.querySelector('.hero-art .hologram-viewport').dataset.motion === 'running');
      await p.locator('#work').evaluate(e => e.scrollIntoView({behavior:'instant'}));
      await p.locator('#project-tab-crm').click();
      await p.emulateMedia({reducedMotion:'reduce'});
      await p.waitForFunction(() => document.querySelector('.hero-art .hologram-viewport').dataset.motion === 'paused');
      await p.waitForTimeout(100);
      assert.equal(await p.locator('html').getAttribute('data-effects'), 'reduced');
      assert.equal(await p.evaluate(() => document.getAnimations().filter(a => a.playState === 'running').length), 0);
      assert.equal(await p.locator('html').evaluate(e => e.classList.contains('cursor-active')), false);
      assert.equal(await p.locator('.showcase-panel:not([hidden])').getAttribute('id'), 'project-panel-crm');
    } finally { await reduced.close(); }
  });
  await check('Touch keeps native controls and selected project tabs remain visible', async () => {
    const touch = await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:844}});
    const p = await touch.newPage();
    try {
      await p.goto(base,{waitUntil:'networkidle'}); await enter(p);
      await p.locator('.showcase-toolbar').scrollIntoViewIfNeeded();
      for(let i=0;i<4;i++) await p.getByRole('button',{name:'Next project',exact:true}).tap();
      await p.waitForTimeout(1200);
      const tab = await p.locator('#project-tab-northstar').boundingBox();
      assert.ok(tab.x >= 0 && tab.x + tab.width <= 390, 'Selected project tab should scroll into the rail');
      await p.setViewportSize({width:1024,height:768});
      await p.setViewportSize({width:390,height:844});
      await p.waitForTimeout(200);
      const resizedTab = await p.locator('#project-tab-northstar').boundingBox();
      assert.ok(resizedTab.x >= 0 && resizedTab.x + resizedTab.width <= 390, 'Active tab remains visible after resizing');
      assert.equal(await p.locator('.experience-cursor').evaluate(e => getComputedStyle(e).display), 'none');
      assert.equal(await p.locator('html').evaluate(e => e.classList.contains('cursor-active')), false);
      await p.screenshot({path:'artifacts/effects-touch-project.png'});
    } finally { await touch.close(); }
  });
  await check('Unavailable WebGL uses the robot illustration and still allows entry', async () => {
    const fallback = await browser.newContext();
    await fallback.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function(type,...args) { return /webgl/.test(type) ? null : original.call(this,type,...args); };
    });
    const p = await fallback.newPage();
    try {
      await p.goto(base,{waitUntil:'networkidle'});
      await p.waitForFunction(() => document.querySelector('.intro-progress').getAttribute('aria-valuenow') === '100');
      assert.equal(await p.locator('.intro-dialog .hologram-ready').count(), 0);
      assert.ok(await p.locator('.intro-dialog .hologram-fallback').isVisible());
      await enter(p); assert.ok(await p.locator('h1').isVisible());
    } finally { await fallback.close(); }
  });
  await check('No JavaScript exposes all five project summaries and native navigation', async () => {
    const plain = await browser.newContext({javaScriptEnabled:false,viewport:{width:375,height:812}});
    const p = await plain.newPage();
    try {
      await p.goto(base);
      assert.ok(await p.locator('h1').isVisible());
      assert.equal(await p.locator('.project-fallback-list article').count(),5);
      assert.ok(await p.locator('.project-fallback-list').isVisible());
      assert.equal(await p.locator('.intro-dialog').isVisible(),false);
      await p.locator('.mobile-nav summary').click();
      assert.ok(await p.getByRole('navigation',{name:'Mobile navigation'}).isVisible());
    } finally { await plain.close(); }
  });
  await check('Privacy and protected owner routes preserved', async () => {
    await page.goto(base + '/privacy.html'); assert.ok(await page.locator('h1').isVisible());
    assert.equal((await page.goto(base + '/admin')).status(),401);
    await page.goto(base + '/owner/login'); assert.ok(await page.locator('#login-form').isVisible());
  });
  await check('No browser exceptions, hydration errors or missing assets', () => assert.deepEqual(errors,[]));
} finally {
  await writeFile('artifacts/react-verification.json', JSON.stringify({results,failures},null,2));
  await browser.close(); await new Promise(done => server.close(done));
}
console.log(results.length + ' passed; ' + failures.length + ' failed.');
if(failures.length) process.exitCode = 1;
