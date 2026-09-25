import { build } from 'esbuild';
import { readFile, writeFile, mkdir, readdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { pages } from '../src/data/pages.js';

const root = resolve(import.meta.dirname, '..');
export async function buildReact() {
  await mkdir(resolve(root, 'assets'), { recursive: true });
  await mkdir(resolve(root, 'artifacts'), { recursive: true });
  // esbuild never removes chunks from earlier builds; stale hashes would otherwise ship in dist.
  for (const file of await readdir(resolve(root, 'assets'))) if (/^react-.*\.js$/.test(file)) await rm(resolve(root, 'assets', file));
  await build({ entryPoints: [resolve(root, 'src/client.jsx')], bundle: true, minify: true, format: 'esm', splitting: true, outdir: resolve(root, 'assets'), entryNames: 'app', chunkNames: 'react-[hash]', jsx: 'automatic', define: { 'process.env.NODE_ENV': '"production"' }, target: ['es2022'], logLevel: 'warning' });
  execFileSync(process.execPath, [resolve(root, 'node_modules/@tailwindcss/cli/dist/index.mjs'), '-i', resolve(root, 'src/app.css'), '-o', resolve(root, 'assets/app.css'), '--minify'], { cwd: root, stdio: 'inherit' });
  const serverEntry = resolve(root, 'artifacts/react-render.mjs');
  await build({ entryPoints: [resolve(root, 'src/render.jsx')], bundle: true, platform: 'node', format: 'esm', packages: 'external', outfile: serverEntry, jsx: 'automatic', logLevel: 'warning' });
  const { render } = await import(pathToFileURL(serverEntry).href + `?build=${Date.now()}`);
  const template = await readFile(resolve(root, 'src/document.html'), 'utf8');
  for (const [key, page] of Object.entries(pages)) {
    const directory = key === 'home' ? root : resolve(root, key);
    await mkdir(directory, { recursive: true });
    const escape = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
    const url = 'https://aynko.dev' + page.path;
    const html = template.replace('<!--APP-->', render(key))
      .replace(/<title>[^<]*<\/title>/, `<title>${escape(page.title)}</title>`)
      .replace(/(<meta\s+name="description"\s+content=")[^"]*/, `$1${escape(page.description)}`)
      .replace(/(<meta\s+property="og:title"\s+content=")[^"]*/, `$1${escape(page.title)}`)
      .replace(/(<meta\s+property="og:description"\s+content=")[^"]*/, `$1${escape(page.description)}`)
      .replace(/(<meta property="og:url" content=")[^"]*/, `$1${url}`)
      .replace(/(<link rel="canonical" href=")[^"]*/, `$1${url}`);
    await writeFile(resolve(directory, 'index.html'), html);
  }
  await writeFile(resolve(root, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...Object.values(pages).map(page => page.path), '/privacy.html'].map(path => `  <url><loc>https://aynko.dev${path}</loc></url>`).join('\n')}\n</urlset>\n`);
  console.log('React rendered to HTML; interactive components and Tailwind CSS compiled.');
}
if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) await buildReact();
