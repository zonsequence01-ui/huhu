/**
 * Local CORS-enabled AAB server for Play Console browser upload (DataTransfer injection).
 * Usage: pnpm serve:android-aab [port]
 */
import { createServer } from "node:http";
import { createReadStream, existsSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const aabPath = join(root, "dist/android-release/com.ctrlz.huhu-release.aab");
const port = Number(process.argv[2]) || 18888;

if (!existsSync(aabPath)) {
  console.error("Missing AAB. Run: pnpm ship:android");
  process.exit(1);
}

const server = createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }
  const file = basename(decodeURIComponent(new URL(req.url ?? "/", "http://local").pathname));
  if (file.endsWith(".aab")) {
    res.writeHead(200, { "Content-Type": "application/octet-stream" });
    createReadStream(aabPath).pipe(res);
    return;
  }
  res.writeHead(404);
  res.end("not found");
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.log(`Port ${port} in use — AAB server may already be running.`);
    process.exit(0);
  }
  throw err;
});

server.listen(port, "127.0.0.1", () => {
  console.log(`AAB server http://127.0.0.1:${port}/com.ctrlz.huhu-release.aab`);
});
