import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { previewServer } from '../server/local.js';
import { resolve } from 'node:path';
const server=previewServer({root:resolve('dist')});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 const context=await browser.newContext({viewport:{width:1440,height:1000}}); const page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/about`);
 await page.waitForSelector('html.react-ready');
 await page.getByRole('tab',{name:/Zakaria Bak/}).click();
 assert.equal(await page.locator('#person-card h3').textContent(),'Zakaria Bak');
 assert.equal(await page.locator('.profile-contact').getAttribute('href'),'mailto:Zakariasurface@outlook.com');
 await page.keyboard.press('ArrowLeft');
 assert.equal(await page.locator('#person-card h3').textContent(),'Aymane Chellak');
 for(const [label,target] of [['An idea that needs to exist.','affiliate'],['The same task. Again. And again.','crm'],['Too many disconnected tools.','erp']]) {
 await page.getByRole('button',{name:new RegExp(label)}).click();
 assert.equal(await page.locator('.solution-project').getAttribute('href'),`/work#${target}`);
 }
 await page.mouse.click(5, 5); await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'})); await page.waitForTimeout(800);
 await page.screenshot({path:'artifacts/about-studio-desktop.png',fullPage:true});
 const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
 assert.deepEqual(audit.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[]);
 await page.setViewportSize({width:390,height:844});
 await page.getByRole('tab',{name:/Zakaria Bak/}).click();
 assert.equal(await page.locator('#person-card h3').textContent(),'Zakaria Bak');
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.mouse.click(5, 5); await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'})); await page.waitForTimeout(800);
 await page.screenshot({path:'artifacts/about-studio-mobile.png',fullPage:true});
 await page.emulateMedia({reducedMotion:'reduce'});
 assert.equal(await page.locator('.profile-content').evaluate(e=>getComputedStyle(e).animationName),'none');
 assert.deepEqual(errors,[]);
 console.log('PASS: founder selection, keyboard navigation, email links, all challenge results, accessibility, mobile overflow, reduced motion, and browser errors.');
}finally{await browser.close();server.close();}

