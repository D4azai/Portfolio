import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { createReadStream } from 'node:fs';
import { resolve, extname, sep } from "node:path";
import { createApp } from "./app.js";
import { createChat } from './chat.js';
const types = { ".mp4": "video/mp4", ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp", ".woff2": "font/woff2", ".xml": "application/xml", ".txt": "text/plain; charset=utf-8" };
const publicFiles = new Set(["index.html", "privacy.html", "styles.css", "experience.css", "robots.txt", "sitemap.xml", "maroc-affiliate-01.png", "odoo-01-chantiers.png", "odoo-02-chantier-form.png", "odoo-03-material-request.png", "odoo-04-estimation.png", "odoo-05-boq.png"]);
export function previewServer({ root = resolve(import.meta.dirname, ".."), app = createApp(), chat = createChat() } = {}) {
  return createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
      if (pathname === '/api/chat') return await chat(req, res);
      if (["/admin", "/admin/", "/owner/login", "/api/control"].includes(pathname)) return await app(req, res);
      const route = pathname.replace(/\/$/, '');
      const relative = pathname === "/" ? "index.html" : /^\/(work|expertise|process|about|contact)$/.test(route) ? route.slice(1) + '/index.html' : pathname.slice(1);
      const file = resolve(root, relative);
      const allowed = publicFiles.has(relative) || /^(work|expertise|process|about|contact)\/index.html$/.test(relative) || ["assets/", "js/", "control/", "Secondo project/"].some(prefix => relative.startsWith(prefix));
      if (!allowed || !file.startsWith(root + sep) || relative.split(/[\\/]/).some(part => part.startsWith(".")) || !types[extname(file)]) { res.writeHead(404).end("Not found"); return; }
      const info = await stat(file);
      if (!info.isFile()) throw new Error();
      // Native video players request byte ranges to seek before downloading the film.
      if (extname(file) === '.mp4') {
        const headers = { 'Content-Type': 'video/mp4', 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' };
        let start = 0, end = info.size - 1, status = 200;
        if (req.headers.range) {
          const match = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
          if (!match || (!match[1] && !match[2])) { res.writeHead(416, { ...headers, 'Content-Range': `bytes */${info.size}` }).end(); return; }
          start = match[1] ? Number(match[1]) : Math.max(0, info.size - Number(match[2]));
          end = match[1] && match[2] ? Math.min(Number(match[2]), info.size - 1) : info.size - 1;
          if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= info.size) { res.writeHead(416, { ...headers, 'Content-Range': `bytes */${info.size}` }).end(); return; }
          status = 206; headers['Content-Range'] = `bytes ${start}-${end}/${info.size}`;
        }
        res.writeHead(status, { ...headers, 'Content-Length': end - start + 1 });
        if (req.method === 'HEAD') res.end();
        else createReadStream(file, { start, end }).on('error', () => res.destroy()).pipe(res);
        return;
      }
      res.writeHead(200, { "Content-Type": types[extname(file)], "Cache-Control": "no-cache", "X-Content-Type-Options": "nosniff" });
      res.end(await readFile(file));
    } catch { if (!res.headersSent) res.writeHead(404); res.end("Not found"); }
  });
}
