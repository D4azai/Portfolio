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
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const results = [], failures = [], errors = [];
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
page.setDefaultTimeout(10000);
page.on('pageerror', e => errors.push(e.message));
page.on('console', message => { if (message.type() === 'error' && /hydration|Minified React/.test(message.text())) errors.push(message.text()); });
page.on('response', r => { if (r.status() === 404) errors.push(`Missing: ${r.url()}`); });
async function check(name, test) { try { await test(); results.push(name); console.log('PASS',name); } catch(e) { failures.push({ name, error:e.stack }); console.error('FAIL',name,e.message); } }
async function audit(label) {
  await page.waitForTimeout(800);
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  await writeFile(`artifacts/react-axe-${label}.json`,JSON.stringify(violations,null,2));
  assert.deepEqual(violations.map(v => ({ id:v.id, targets:v.nodes.map(n => n.target) })), []);
}
try {
  await page.goto(base,{ waitUntil:'networkidle' });
  await check('React hydrates the pre-rendered portfolio and serves local assets',async()=>{
    await page.waitForSelector('html.react-ready');
    assert.equal(await page.locator('h1').count(),1);
    assert.equal(await page.locator('[data-case]').count(),5);
    assert.ok(await page.evaluate(()=>document.fonts.check('500 16px Manrope')));
    assert.deepEqual(await page.evaluate(()=>performance.getEntriesByType('resource').filter(r=>!r.name.startsWith(location.origin)).map(r=>r.name)),[]);
    await page.screenshot({ path:'artifacts/react-desktop-hero.png' });
  });
  await check('Interactive architecture changes layer and opens accessible details',async()=>{
    for(const key of ['data','flow','ai','edge']) {
      await page.locator('.layer-button').filter({hasText:new RegExp(key,'i')}).click();
      await page.locator(`[data-pillar="${key}"]`).click();
      assert.ok(await page.locator('.pillar-dialog').evaluate(e=>e.open));
      await page.keyboard.press('Escape');
      assert.ok(await page.locator(`[data-pillar="${key}"]`).evaluate(e=>e===document.activeElement));
    }
  });
  await check('Project filters, every case, gallery switching, and focus restoration',async()=>{
    await page.getByRole('button',{name:/Interfaces/}).click();
    assert.equal(await page.locator('.project-card').count(),2);
    assert.match(await page.locator('.project-grid').innerText(),/Studio North/);
    assert.doesNotMatch(await page.locator('.project-grid').innerText(),/Construction/);
    await page.getByRole('button',{name:/Platforms/}).click();
    assert.equal(await page.locator('.project-card').count(),2);
    await page.getByRole('button',{name:/All work/}).click();
    for(const key of ['affiliate','erp','crm','studioNorth','northstar']) {
      const trigger=page.locator(`[data-case="${key}"]`);
      await trigger.click();
      assert.ok(await page.locator('.case-dialog').evaluate(e=>e.open));
      if(key==='erp') {
        await page.getByRole('button',{name:'02 / Material request workflow'}).click();
        assert.match(await page.locator('.gallery figcaption').innerText(),/Material request/);
        await audit('case');
      }
      await page.keyboard.press('Escape');
      assert.ok(await trigger.evaluate(e=>e===document.activeElement));
      assert.equal(await page.evaluate(()=>document.body.style.overflow),'');
    }
  });
  await check('Process tabs support arrows, Home and End',async()=>{
    await page.locator('#step-0').focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('#step-1').getAttribute('aria-selected'),'true');
    assert.match(await page.locator('#process-panel').innerText(),/blueprint/);
    await page.keyboard.press('End');
    assert.equal(await page.locator('#step-3').getAttribute('aria-selected'),'true');
    await page.keyboard.press('Home');
    assert.equal(await page.locator('#step-0').getAttribute('aria-selected'),'true');
  });
  await check('Responsive layouts, loaded screenshots, and desktop/mobile WCAG',async()=>{
    for(const width of [320,375,430,768,1024,1280,1440,1920]) {
      await page.setViewportSize({width,height:1000});
      for(const id of ['home','work','expertise','method','about','faq','contact']) {
        await page.locator(`#${id}`).evaluate(e=>e.scrollIntoView({behavior:'instant'}));
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Overflow: ${width}/${id}`);
      }
      if([375,1440].includes(width)) await audit(`page-${width}`);
    }
    for(const img of await page.locator('.project-media img').all()) {
      await img.scrollIntoViewIfNeeded();
      await img.evaluate(e=>e.decode());
    }
    await page.setViewportSize({width:1440,height:1000});
    for(const id of ['work','expertise','method','about','contact']) {
      await page.locator(`#${id}`).evaluate(e=>e.scrollIntoView({behavior:'instant'}));
      await page.waitForTimeout(800);
      await page.screenshot({path:`artifacts/react-${id}.png`});
    }
  });
  await check('Mobile menu, FAQ, and enquiry fallback remain usable',async()=>{
    await page.setViewportSize({width:375,height:812});
    await page.goto(base,{waitUntil:'networkidle'});
    await page.waitForTimeout(850);
    await page.screenshot({path:'artifacts/react-mobile-hero.png'});
    await page.locator('.mobile-nav summary').click();
    await audit('menu');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.mobile-nav').evaluate(e=>e.open),false);
    await page.locator('.mobile-nav summary').click();
    await page.getByRole('navigation',{name:'Mobile navigation'}).getByText('About').click();
    assert.equal(await page.locator('.mobile-nav').evaluate(e=>e.open),false);
    await page.locator('.faq-item summary').first().click();
    assert.equal(await page.locator('.faq-item').first().evaluate(e=>e.open),true);
    await page.locator('[data-contact]').click();
    assert.equal(await page.locator('#contact-dialog').evaluate(e=>e.open),true);
    await page.waitForFunction(()=>document.querySelector('[data-form-status]').textContent.length>0);
    assert.equal(await page.locator('.signal-success').isVisible(),false);
    await audit('contact');
    await page.keyboard.press('Escape');
    assert.ok(await page.locator('[data-contact]').evaluate(e=>e===document.activeElement));
  });
  await check('No JavaScript content and navigation; reduced motion',async()=>{
    const plain=await browser.newContext({javaScriptEnabled:false,viewport:{width:375,height:812}});
    const p=await plain.newPage();await p.goto(base);
    assert.ok(await p.locator('h1').isVisible());assert.equal(await p.locator('.project-card').count(),4);
    await p.locator('.mobile-nav summary').click();assert.ok(await p.getByRole('navigation',{name:'Mobile navigation'}).isVisible());
    await plain.close();
    const reduced=await browser.newContext({reducedMotion:'reduce'});
    const rp=await reduced.newPage();await rp.goto(base,{waitUntil:'networkidle'});
    assert.equal(await rp.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length),0);
    await reduced.close();
  });
  await check('Privacy and protected owner routes preserved',async()=>{
    await page.goto(`${base}/privacy.html`);assert.ok(await page.locator('h1').isVisible());
    assert.equal((await page.goto(`${base}/admin`)).status(),401);
    await page.goto(`${base}/owner/login`);assert.ok(await page.locator('#login-form').isVisible());
  });
  await check('No browser exceptions, hydration errors, or missing assets',()=>assert.deepEqual(errors,[]));
} finally {
  await writeFile('artifacts/react-verification.json',JSON.stringify({results,failures},null,2));
  await browser.close();await new Promise(done=>server.close(done));
}
console.log(`${results.length} passed; ${failures.length} failed.`);
if(failures.length)process.exitCode=1;
