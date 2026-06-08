/**
 * CORS-enabled local PNG server for ASC app screenshot fetch uploads.
 * Usage: node scripts/serve-store-upload-png.mjs [port] [market]
 */
import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const market = process.argv[3] || "tw";
const dir = join(root, "dist/store-upload", market, "app-store");
const port = Number(process.argv[2]) || 8768;

const server = createServer((req, res) => {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.writeHead(204);
    res.end();
    return;
  }
  const file = basename(new URL(req.url ?? "/", "http://local").pathname);
  const pngPath = join(dir, file);
  if (!file.endsWith(".png") || !existsSync(pngPath)) {
    res.writeHead(404);
    res.end("not found");
    return;
  }
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "image/png");
  res.end(readFileSync(pngPath));
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Store upload PNG server http://127.0.0.1:${port}/ (${dir})`);
});
