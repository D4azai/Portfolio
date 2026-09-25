import { chromium } from 'playwright';
import sharp from 'sharp';
import { previewServer } from '../server/local.js';
import { resolve } from 'node:path';
const server=previewServer({root:resolve('dist')});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
 const page=await context.newPage(); page.setDefaultTimeout(20000);
 await page.goto(`http://127.0.0.1:${server.address().port}/#home`);
 await page.locator('.cinematic-viewport').scrollIntoViewIfNeeded();
 await page.waitForSelector('.cinematic-ready');
 await page.waitForTimeout(500);
 await page.addStyleTag({content:'.cinematic-topline,.cinematic-caption,.experience-cursor,.site-header,.reading-progress{visibility:hidden!important}'});
 const capture=await page.locator('.cinematic-viewport canvas').screenshot();
 await sharp(capture).webp({quality:90}).toFile('assets/cinematic-still.webp');
 console.log('Saved the real-time sculpture as its loading and no-WebGL poster.');
} finally {await browser.close();server.close();}
