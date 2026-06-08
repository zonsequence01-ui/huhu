/**
 * Resize App Store PNGs to Google Play phone size (1080×1920).
 * Usage:
 *   pnpm resize:aso-play-screenshots
 *   pnpm resize:aso-play-screenshots -- --market=jp
 *   pnpm resize:aso-play-screenshots -- --all
 */
import { readFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { STORE_MARKETS } from "@huhu/shared";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const srcRoot = join(root, "dist/aso-screenshots");
const outRoot = join(root, "dist/aso-screenshots-play");
const viewport = { width: 1080, height: 1920 };

const args = process.argv.slice(2);
const allMarkets = args.includes("--all");
const marketArg = args.find((a) => a.startsWith("--market="));
const markets = allMarkets
  ? STORE_MARKETS.map((m) => m.market)
  : [marketArg?.split("=")[1] ?? "tw"];

const FILES = [
  "01-chat.png",
  "02-modes.png",
  "03-character-creator.png",
  "04-diary.png",
  "05-subscribe.png",
  "06-privacy.png",
];

async function resizeOne(page, inputPath, outputPath) {
  const b64 = readFileSync(inputPath).toString("base64");
  await page.setContent(
    `<!DOCTYPE html><html><head><style>
      * { margin:0; padding:0; box-sizing:border-box; }
      html, body { width:1080px; height:1920px; overflow:hidden; background:#0f0f14; }
      img { width:100%; height:100%; object-fit:cover; object-position:top center; display:block; }
    </style></head><body>
    <img src="data:image/png;base64,${b64}" alt="" />
    </body></html>`,
    { waitUntil: "load" },
  );
  await page.screenshot({ path: outputPath, fullPage: false });
}

async function resizeMarket(market, page) {
  const srcDir = join(srcRoot, market);
  const outDir = join(outRoot, market);
  mkdirSync(outDir, { recursive: true });

  for (const file of FILES) {
    const src = join(srcDir, file);
    if (!existsSync(src)) {
      console.error(`✗ missing source ${src}`);
      process.exitCode = 1;
      continue;
    }
    const dest = join(outDir, file);
    await resizeOne(page, src, dest);
    console.log(`wrote ${dest}`);
  }
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });

try {
  for (const market of markets) {
    console.log(`\n=== ${market} (Google Play 1080×1920) ===`);
    await resizeMarket(market, page);
  }
  console.log("\nDone. Upload from dist/aso-screenshots-play/ per docs/ASO_SCREENSHOTS.md");
} finally {
  await browser.close();
}

if (process.exitCode) process.exit(process.exitCode);
