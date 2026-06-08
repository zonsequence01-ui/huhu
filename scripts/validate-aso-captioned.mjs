/**
 * Validate captioned ASO PNG folders (dimensions only).
 * Usage: pnpm validate:aso-captioned:all
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { STORE_MARKETS } from "@huhu/shared";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const allMarkets = args.includes("--all");
const marketArg = args.find((a) => a.startsWith("--market="));
const markets = allMarkets
  ? STORE_MARKETS.map((m) => m.market)
  : [marketArg?.split("=")[1] ?? "tw"];

const SHOTS = [
  "01-chat.png",
  "02-modes.png",
  "03-character-creator.png",
  "04-diary.png",
  "05-subscribe.png",
  "06-privacy.png",
];

function pngSize(path) {
  const buf = readFileSync(path);
  if (buf.length < 24 || buf[0] !== 0x89) return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function checkDir(dir, w, h) {
  let failed = false;
  for (const file of SHOTS) {
    const path = join(dir, file);
    if (!existsSync(path)) {
      console.error(`✗ missing ${path}`);
      failed = true;
      continue;
    }
    if (statSync(path).size < 10_000) {
      console.error(`✗ too small ${path}`);
      failed = true;
      continue;
    }
    const dim = pngSize(path);
    if (!dim || dim.width !== w || dim.height !== h) {
      console.error(
        `✗ ${path}: ${dim?.width ?? "?"}×${dim?.height ?? "?"} (want ${w}×${h})`,
      );
      failed = true;
    }
  }
  return failed;
}

let failed = false;
for (const market of markets) {
  const appDir = join(root, "dist/aso-screenshots-captioned", market);
  const playDir = join(root, "dist/aso-screenshots-play-captioned", market);
  if (!existsSync(appDir) && !existsSync(playDir)) {
    console.error(`✗ ${market}: no captioned folders — pnpm compose:aso-screenshots -- --market=${market}`);
    failed = true;
    continue;
  }
  if (checkDir(appDir, 1284, 2778) || checkDir(playDir, 1080, 1920)) {
    failed = true;
  } else {
    console.log(`✓ ${market} captioned (app 1284×2778, play 1080×1920)`);
  }
}

if (failed) process.exit(1);
console.log("\nCaptioned ASO validation OK");
