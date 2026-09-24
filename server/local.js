import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { createApp } from "./app.js";
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp", ".woff2": "font/woff2", ".xml": "application/xml", ".txt": "text/plain; charset=utf-8" };
const publicFiles = new Set(["index.html", "privacy.html", "styles.css", "motion.css", "system.css", "experience.css", "upgrade.css", "script.js", "robots.txt", "sitemap.xml", "maroc-affiliate-01.png", "odoo-01-chantiers.png", "odoo-02-chantier-form.png", "odoo-03-material-request.png", "odoo-04-estimation.png", "odoo-05-boq.png"]);
export function previewServer({ root = resolve(import.meta.dirname, ".."), app = createApp() } = {}) {
  return createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
      if (["/admin", "/admin/", "/owner/login", "/api/control"].includes(pathname)) return await app(req, res);
      const relative = pathname === "/" ? "index.html" : pathname.slice(1);
      const file = resolve(root, relative);
      const allowed = publicFiles.has(relative) || ["assets/", "js/", "control/", "Secondo project/"].some(prefix => relative.startsWith(prefix));
      if (!allowed || !file.startsWith(root + sep) || relative.split(/[\\/]/).some(part => part.startsWith(".")) || !types[extname(file)]) { res.writeHead(404).end("Not found"); return; }
      if (!(await stat(file)).isFile()) throw new Error();
      res.writeHead(200, { "Content-Type": types[extname(file)], "Cache-Control": "no-cache", "X-Content-Type-Options": "nosniff" });
      res.end(await readFile(file));
    } catch { if (!res.headersSent) res.writeHead(404); res.end("Not found"); }
  });
}
