import { resolve } from "node:path";
try { process.loadEnvFile(resolve(import.meta.dirname, "../.env.local")); } catch (error) { if (error.code !== "ENOENT") throw error; }
const port = Number(process.env.PORT || 4173);
process.env.SITE_ORIGIN ||= 'http://127.0.0.1:' + port;
const { previewServer } = await import("../server/local.js");
const server = previewServer({ root: resolve(import.meta.dirname, "..", process.argv[2] || ".") });
server.listen(port, "127.0.0.1", () => console.log('AYNKO preview: http://127.0.0.1:' + port));
