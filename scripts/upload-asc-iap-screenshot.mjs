/**
 * Upload IAP review screenshot via chunked base64 injection (Cursor browser CDP).
 * Usage: node scripts/upload-asc-iap-screenshot.mjs <inputId> <pngPath>
 */
import { readFileSync } from "node:fs";

const [, , inputId, pngPath] = process.argv;
if (!inputId || !pngPath) {
  console.error("Usage: node upload-asc-iap-screenshot.mjs <inputId> <pngPath>");
  process.exit(1);
}

const b64 = readFileSync(pngPath).toString("base64");
const chunkSize = 8000;
const chunks = [];
for (let i = 0; i < b64.length; i += chunkSize) {
  chunks.push(b64.slice(i, i + chunkSize));
}

console.log(JSON.stringify({ inputId, fileName: pngPath.split(/[/\\]/).pop(), chunks: chunks.length, totalLen: b64.length }));
