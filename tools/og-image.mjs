import sharp from 'sharp';
import { resolve } from 'node:path';

// Branded 1200x630 link preview. Regenerate with `node tools/og-image.mjs`.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="glow" cx="78%" cy="30%" r="55%"><stop offset="0" stop-color="#2b3a2a"/><stop offset="1" stop-color="#101513" stop-opacity="0"/></radialGradient>
    <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse"><path d="M80 0H0V80" fill="none" stroke="#ffffff" stroke-opacity=".05"/></pattern>
  </defs>
  <rect width="1200" height="630" fill="#101513"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <rect width="1200" height="630" fill="url(#grid)"/>
  <circle cx="930" cy="250" r="230" fill="none" stroke="#d2f78a" stroke-opacity=".18"/>
  <circle cx="930" cy="250" r="290" fill="none" stroke="#d2f78a" stroke-opacity=".1" stroke-dasharray="3 12"/>
  <g transform="translate(790 110) scale(7)"><path d="m5 33 13-26h5l13 26h-8l-7-16-8 16H5Z" fill="#d2f78a"/><path d="M17 29h8l-4-8-4 8Z" fill="#d2f78a"/></g>
  <g font-family="Manrope, Arial, Helvetica, sans-serif" fill="#f4f4ec">
    <text x="80" y="118" font-size="30" font-weight="800" letter-spacing="6">AYNKO</text>
    <text x="80" y="300" font-size="112" font-weight="600" letter-spacing="-5">Human ideas.</text>
    <text x="80" y="415" font-size="112" font-weight="600" letter-spacing="-5">Exceptional <tspan fill="#d2f78a" font-family="Georgia, 'Times New Roman', serif" font-style="italic" font-weight="400">systems.</tspan></text>
    <text x="80" y="510" font-size="26" fill="#a5ada3">SaaS, ERP, CRM and automation for real operations.</text>
    <text x="80" y="570" font-size="20" fill="#a5ada3" letter-spacing="3">AYMANE CHELLAK &amp; ZAKARIA BAK  /  AYNKO.DEV</text>
  </g>
</svg>`;
const out = resolve(import.meta.dirname, '../assets/og.jpg');
await sharp(Buffer.from(svg)).jpeg({ quality: 88, mozjpeg: true }).toFile(out);
console.log('Wrote', out);
