import { build } from 'esbuild';
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { spawn, execFileSync } from 'node:child_process';
import { once } from 'node:events';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { filmChapters } from '../src/data/process-film.js';

const root=resolve(import.meta.dirname,'..'), out=resolve(root,'assets/film');
await mkdir(out,{recursive:true}); await mkdir(resolve(root,'artifacts'),{recursive:true});
const bundle=await build({entryPoints:[resolve(root,'tools/film/scene.js')],bundle:true,format:'esm',write:false});
const fonts=await Promise.all(['manrope-latin.woff2','dm-mono-latin.woff2'].map(name=>readFile(resolve(root,'assets/fonts',name))));
const server=createServer((req,res)=>{
  if(req.url==='/scene.js'){res.writeHead(200,{'Content-Type':'text/javascript'}).end(bundle.outputFiles[0].text);return;}
  if(req.url==='/sans.woff2'||req.url==='/mono.woff2'){res.writeHead(200,{'Content-Type':'font/woff2'}).end(fonts[req.url==='/sans.woff2'?0:1]);return;}
  res.writeHead(200,{'Content-Type':'text/html'}).end('<style>@font-face{font-family:Manrope;src:url(/sans.woff2);font-weight:200 800}@font-face{font-family:"DM Mono";src:url(/mono.woff2)}body{margin:0;background:#0c1511}canvas{display:block}</style><span style="position:absolute;opacity:0;font-family:Manrope">Load</span><span style="position:absolute;opacity:0;font-family:DM Mono">Load</span><script type="module" src="/scene.js"></script>');
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const browser=await chromium.launch({channel:'msedge',headless:true});
let encoder;
try{
  const page=await browser.newPage({viewport:{width:1280,height:720}});
  page.on('pageerror',error=>{throw error;});
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.waitForFunction(()=>typeof window.renderFilmFrame==='function');
  await page.evaluate(()=>document.fonts.ready);
  for(let i=0;i<4;i++){
    const png=Buffer.from(await page.evaluate(time=>window.renderFilmFrame(time,true),i*8+4),'base64');
    await writeFile(resolve(root,`artifacts/process-film-${i+1}.png`),png);
    await sharp(png).webp({quality:90}).toFile(resolve(out,`${filmChapters[i].title.toLowerCase()}.webp`));
  }
  if(!process.argv.includes('--preview')){
    let ffmpeg=process.env.FFMPEG_PATH;
    if(!ffmpeg) {try{ffmpeg=execFileSync('python',['-c','import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())'],{encoding:'utf8'}).trim();}catch{ffmpeg='ffmpeg';}}
    for (const [index, chapter] of filmChapters.entries()) {
    encoder=spawn(ffmpeg,['-y','-loglevel','error','-f','image2pipe','-framerate','24','-vcodec','png','-i','pipe:0','-an','-c:v','libx264','-preset','slow','-crf','16','-pix_fmt','yuv420p','-movflags','+faststart',resolve(out,`${chapter.title.toLowerCase()}.mp4`)],{windowsHide:true,stdio:['pipe','ignore','pipe']});
    let encoderError='';encoder.stderr.on('data',data=>encoderError+=data);
    const finished=new Promise((resolve,reject)=>{encoder.on('error',reject);encoder.on('close',code=>code===0?resolve():reject(new Error(encoderError||`Encoder exited ${code}`)));});
    // Handle failure immediately even if rendering has not reached the final await.
    finished.catch(()=>{});
    for(let frame=0;frame<8*24;frame++){
      const png=Buffer.from(await page.evaluate(time=>window.renderFilmFrame(time,true),index*8+frame/24),'base64');
      if(!encoder.stdin.write(png)) await once(encoder.stdin,'drain');
      if(frame%96===0) console.log(`${chapter.title}: rendered ${frame/24}s / 8s`);
    }
    encoder.stdin.end();await finished;console.log(`Created ${chapter.title}: 8s, 1280×720, 24fps H.264 loop.`);
    }
  }
}finally{if(encoder && encoder.exitCode===null) encoder.kill();await browser.close();await new Promise(done=>server.close(done));}
