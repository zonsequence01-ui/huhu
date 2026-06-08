/**
 * CORS-enabled local PNG server for ASC browser fetch uploads.
 * Serves IAP review PNGs + App Store 1284×2778 screenshots.
 * Usage: node scripts/serve-iap-review-png.mjs [port]
 */
import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dirs = [
  join(root, "dist/asc-iphone69/tw"),
  join(root, "dist/iap-review-screenshots"),
  join(root, "dist/store-graphics"),
  join(root, "dist/aso-screenshots-play/tw"),
];
const port = Number(process.argv[2]) || 8766;

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
  let pngPath = null;
  for (const dir of dirs) {
    const candidate = join(dir, file);
    if (file.endsWith(".png") && existsSync(candidate)) {
      pngPath = candidate;
      break;
    }
  }
  if (!pngPath) {
    res.writeHead(404);
    res.end("not found");
    return;
  }
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "image/png");
  res.end(readFileSync(pngPath));
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.log(`Port ${port} already in use — PNG server likely running at http://127.0.0.1:${port}/`);
    process.exit(0);
  }
  throw err;
});

server.listen(port, "127.0.0.1", () => {
  console.log(`PNG server http://127.0.0.1:${port}/ (${dirs.join("; ")})`);
});
