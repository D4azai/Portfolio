import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { buildReact } from './build-react.mjs';

await buildReact();

// Static deployment: validate the active modules and stage only public assets.
const root = resolve(import.meta.dirname, "..");
const out = resolve(root, "dist");
const modules = ["script.js", ...["navigation", "motion", "motion-utils", "pointer", "system-core", "image-manifest", "pillars", "entry", "contact", "analytics"].map(name => `js/${name}.js`), "control/login.js", "control/dashboard.js"];
for (const file of modules) execFileSync(process.execPath, ["--check", resolve(root, file)]);
for (const file of ["api/control.js", "server/app.js", "server/security.js", "server/supabase.js", "server/pages.js"]) execFileSync(process.execPath, ["--check", resolve(root, file)]);
const files = ["index.html", "privacy.html", "styles.css", "motion.css", "system.css", "experience.css", "upgrade.css", "control/control.css", "robots.txt", "sitemap.xml", ...modules,
  "maroc-affiliate-01.png", "odoo-01-chantiers.png", "odoo-02-chantier-form.png", "odoo-03-material-request.png", "odoo-04-estimation.png", "odoo-05-boq.png"];
await mkdir(out, { recursive: true });
for (const file of files) {
  await mkdir(resolve(out, file, ".."), { recursive: true });
  await writeFile(resolve(out, file), await readFile(resolve(root, file)));
}
for (const folder of ["assets", "Secondo project"]) await cp(resolve(root, folder), resolve(out, folder), { recursive: true });
console.log(`Validated ${modules.length} modules. Static production output: ${out}`);
