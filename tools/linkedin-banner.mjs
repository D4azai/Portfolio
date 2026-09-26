import sharp from 'sharp';
import { resolve } from 'node:path';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="400" viewBox="0 0 1800 400">
  <defs>
    <radialGradient id="glow" cx="82%" cy="48%" r="58%"><stop offset="0" stop-color="#34452f"/><stop offset="1" stop-color="#101513" stop-opacity="0"/></radialGradient>
    <pattern id="grid" width="72" height="72" patternUnits="userSpaceOnUse"><path d="M72 0H0V72" fill="none" stroke="#ffffff" stroke-opacity=".045"/></pattern>
  </defs>
  <rect width="1800" height="400" fill="#101513"/>
  <rect width="1800" height="400" fill="url(#glow)"/>
  <rect width="1800" height="400" fill="url(#grid)"/>
  <circle cx="1515" cy="202" r="171" fill="none" stroke="#d2f78a" stroke-opacity=".2"/>
  <circle cx="1515" cy="202" r="194" fill="none" stroke="#d2f78a" stroke-opacity=".1" stroke-dasharray="3 12"/>
  <path d="M98 104h42" stroke="#d2f78a" stroke-width="3"/>
  <g font-family="Manrope, Arial, Helvetica, sans-serif">
    <text x="98" y="88" fill="#d2f78a" font-size="19" font-weight="700" letter-spacing="5">AYNKO / SOFTWARE ENGINEERING</text>
    <text x="98" y="205" fill="#f4f4ec" font-size="77" font-weight="600" letter-spacing="-3.5">Human ideas.</text>
    <text x="98" y="292" fill="#f4f4ec" font-size="72" font-weight="600" letter-spacing="-3.5">Exceptional <tspan fill="#d2f78a" font-family="Georgia, 'Times New Roman', serif" font-style="italic" font-weight="400">systems.</tspan></text>
    <text x="101" y="344" fill="#a5ada3" font-size="21">Thoughtful software, connected workflows, and intelligent systems.</text>
  </g>
</svg>`;

const robot = await sharp(resolve(import.meta.dirname, '../assets/operator-still.webp'))
  .resize({ width: 455, height: 365, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .toBuffer();
const out = resolve(import.meta.dirname, '../assets/linkedin-services-banner.jpg');

await sharp(Buffer.from(svg))
  .composite([{ input: robot, left: 1300, top: 18 }])
  .jpeg({ quality: 92, mozjpeg: true })
  .toFile(out);

console.log('Wrote', out);
