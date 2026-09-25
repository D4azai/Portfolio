import { chromium } from 'playwright';
import sharp from 'sharp';
import { previewServer } from '../server/local.js';
import { resolve } from 'node:path';
const server=previewServer({root:resolve('dist')});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
 const page=await context.newPage();page.setDefaultTimeout(20000);
 await page.goto(`http://127.0.0.1:${server.address().port}/#home`);
 await page.waitForSelector('.hero-art .hologram-ready');
 await page.addStyleTag({content:'html,body,#root,.hero-section,.hologram-stage{background:transparent!important;box-shadow:none!important;border-color:transparent!important}.hero-grid,.hero-atmosphere,.hologram-ambient,.robot-annotation,.ambient-field,.experience-cursor,.site-header,.reading-progress{visibility:hidden!important}'});
 const capture=await page.locator('.hero-art .hologram-viewport canvas').screenshot({omitBackground:true});
 await sharp(capture).webp({quality:92,alphaQuality:100}).toFile('assets/operator-still.webp');
 console.log('Saved the refined robot as its transparent fallback.');
} finally {await browser.close();server.close();}
