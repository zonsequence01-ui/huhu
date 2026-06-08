/**
 * Validate dist/store-upload bundle (per-market app-store, google-play, brief, catalog).
 * Usage: pnpm validate:store-upload
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { STORE_MARKETS } from "@huhu/shared";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const bundleRoot = join(root, "dist/store-upload");

const APP_SHOTS = [
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

function checkPng(dir, file, minW, minH) {
  const path = join(dir, file);
  if (!existsSync(path)) return `missing ${path}`;
  if (statSync(path).size < 10_000) return `too small: ${path}`;
  const dim = pngSize(path);
  if (!dim || dim.width !== minW || dim.height !== minH) {
    return `bad size ${dim?.width ?? "?"}×${dim?.height ?? "?"}: ${path}`;
  }
  return null;
}

let failed = false;

if (!existsSync(bundleRoot)) {
  console.error("✗ dist/store-upload missing — run: pnpm package:store-upload");
  process.exit(1);
}

for (const { market } of STORE_MARKETS) {
  let marketOk = true;
  const marketDir = join(bundleRoot, market);
  if (!existsSync(marketDir)) {
    console.error(`✗ missing ${marketDir}`);
    failed = true;
    continue;
  }

  const appDir = join(marketDir, "app-store");
  const playDir = join(marketDir, "google-play");
  const appCapDir = join(marketDir, "app-store-captioned");
  const playCapDir = join(marketDir, "google-play-captioned");
  for (const file of APP_SHOTS) {
    const appErr = checkPng(appDir, file, 1284, 2778);
    const playErr = checkPng(playDir, file, 1080, 1920);
    if (appErr || playErr) {
      console.error(`✗ ${market}: ${appErr ?? playErr}`);
      marketOk = false;
      failed = true;
    }
    if (existsSync(appCapDir)) {
      const capErr = checkPng(appCapDir, file, 1284, 2778);
      if (capErr) {
        console.error(`✗ ${market} app-store-captioned: ${capErr}`);
        marketOk = false;
        failed = true;
      }
    }
    if (existsSync(playCapDir)) {
      const capErr = checkPng(playCapDir, file, 1080, 1920);
      if (capErr) {
        console.error(`✗ ${market} google-play-captioned: ${capErr}`);
        marketOk = false;
        failed = true;
      }
    }
  }
  if (!existsSync(appCapDir) || !existsSync(playCapDir)) {
    console.error(`✗ ${market}: missing captioned folders — run pnpm compose:aso-screenshots -- --all`);
    marketOk = false;
    failed = true;
  }

  const brief = join(marketDir, `${market}-aso-brief.md`);
  const catalog = join(marketDir, `${market}-store-catalog.json`);
  const iapList = join(marketDir, `${market}-iap-checklist.md`);
  if (!existsSync(brief)) {
    console.error(`✗ missing ${brief}`);
    marketOk = false;
    failed = true;
  }
  if (!existsSync(iapList)) {
    console.error(`✗ missing ${iapList}`);
    marketOk = false;
    failed = true;
  }
  if (!existsSync(catalog)) {
    console.error(`✗ missing ${catalog}`);
    marketOk = false;
    failed = true;
  } else {
    const cat = JSON.parse(readFileSync(catalog, "utf8"));
    if (cat.market !== market) {
      console.error(`✗ ${market}: catalog market mismatch`);
      marketOk = false;
      failed = true;
    }
  }

  if (marketOk) {
    console.log(`✓ ${market} (raw + captioned PNGs, brief, catalog)`);
  }
}

if (failed) {
  console.error("\nRun: pnpm package:store-upload");
  process.exit(1);
}

console.log("\nStore upload bundle validation OK");
