import { watch } from 'node:fs';
import { resolve } from 'node:path';
import { buildReact } from './build-react.mjs';

await buildReact();
await import('./serve.mjs');
let timer, building = false, again = false;
async function rebuild() {
  if (building) { again = true; return; }
  building = true;
  try { await buildReact(); console.log('Updated — refresh the browser to see your changes.'); }
  catch (error) { console.error('Build failed:', error.message); }
  finally { building = false; if (again) { again = false; await rebuild(); } }
}
watch(resolve(import.meta.dirname, '../src'), { recursive: true }, () => { clearTimeout(timer); timer = setTimeout(rebuild, 150); });
