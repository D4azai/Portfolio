import sharp from 'sharp';
import { resolve } from 'node:path';

// Branded 1200x630 link preview. Regenerate with `node tools/og-image.mjs`.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="glow" cx="78%" cy="44%" r="55%"><stop offset="0" stop-color="#34452f"/><stop offset="1" stop-color="#101513" stop-opacity="0"/></radialGradient>
    <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse"><path d="M80 0H0V80" fill="none" stroke="#ffffff" stroke-opacity=".05"/></pattern>
  </defs>
  <rect width="1200" height="630" fill="#101513"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <rect width="1200" height="630" fill="url(#grid)"/>
  <circle cx="930" cy="316" r="229" fill="none" stroke="#d2f78a" stroke-opacity=".18"/>
  <circle cx="930" cy="316" r="278" fill="none" stroke="#d2f78a" stroke-opacity=".1" stroke-dasharray="3 12"/>
  <path d="M72 166h36" stroke="#d2f78a" stroke-width="2"/>
  <g font-family="Manrope, Arial, Helvetica, sans-serif">
    <text x="72" y="116" fill="#f4f4ec" font-size="25" font-weight="800" letter-spacing="6">AYNKO</text>
    <text x="72" y="254" fill="#f4f4ec" font-size="76" font-weight="600" letter-spacing="-4">Human ideas.</text>
    <text x="72" y="343" fill="#f4f4ec" font-size="76" font-weight="600" letter-spacing="-4">Exceptional</text>
    <text x="72" y="426" fill="#d2f78a" font-family="Georgia, 'Times New Roman', serif" font-size="82" font-style="italic">systems.</text>
    <text x="74" y="489" fill="#a5ada3" font-size="19">SaaS, ERP, CRM and automation for real operations.</text>
    <text x="74" y="558" fill="#a5ada3" font-size="13" letter-spacing="2.4">AYMANE CHELLAK &amp; ZAKARIA BAK  /  AYNKO.DEV</text>
  </g>
</svg>`;
const out = resolve(import.meta.dirname, '../assets/og.jpg');
const robot = await sharp(resolve(import.meta.dirname, '../assets/operator-still.webp'))
  .resize({ width: 560, height: 460, fit: 'contain' })
  .toBuffer();
await sharp(Buffer.from(svg))
  .composite([{ input: robot, left: 640, top: 112 }])
  .jpeg({ quality: 90, mozjpeg: true })
  .toFile(out);
console.log('Wrote', out);
