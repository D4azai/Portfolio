import { build } from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
export async function buildReact() {
  await mkdir(resolve(root, 'assets'), { recursive: true });
  await mkdir(resolve(root, 'artifacts'), { recursive: true });
  await build({ entryPoints: [resolve(root, 'src/client.jsx')], bundle: true, minify: true, format: 'esm', splitting: true, outdir: resolve(root, 'assets'), entryNames: 'app', chunkNames: 'react-[hash]', jsx: 'automatic', define: { 'process.env.NODE_ENV': '"production"' }, target: ['es2022'], logLevel: 'warning' });
  execFileSync(process.execPath, [resolve(root, 'node_modules/@tailwindcss/cli/dist/index.mjs'), '-i', resolve(root, 'src/app.css'), '-o', resolve(root, 'assets/app.css'), '--minify'], { cwd: root, stdio: 'inherit' });
  const serverEntry = resolve(root, 'artifacts/react-render.mjs');
  await build({ entryPoints: [resolve(root, 'src/render.jsx')], bundle: true, platform: 'node', format: 'esm', packages: 'external', outfile: serverEntry, jsx: 'automatic', logLevel: 'warning' });
  const { render } = await import(pathToFileURL(serverEntry).href + `?build=${Date.now()}`);
  const template = await readFile(resolve(root, 'src/document.html'), 'utf8');
  await writeFile(resolve(root, 'index.html'), template.replace('<!--APP-->', render()));
  console.log('React rendered to HTML; interactive components and Tailwind CSS compiled.');
}
if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) await buildReact();
