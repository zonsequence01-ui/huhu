/**
 * Resize App Store iPhone 6.7" screenshots to ASC-required 1284×2778.
 * Usage: pnpm resize:aso-app-store-screenshots [--market=tw] [--all]
 */
import { existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { STORE_MARKETS } from "@huhu/shared";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const WIDTH = 1284;
const HEIGHT = 2778;

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

async function resizeOne(page, src, dest) {
  const b64 = (await import("node:fs")).readFileSync(src).toString("base64");
  await page.setViewportSize({ width: WIDTH, height: HEIGHT });
  await page.setContent(
    `<!DOCTYPE html><html><head><style>
      html, body { margin:0; width:${WIDTH}px; height:${HEIGHT}px; overflow:hidden; background:#0f0f14; }
      img { width:100%; height:100%; object-fit:cover; object-position:top center; display:block; }
    </style></head><body><img src="data:image/png;base64,${b64}" alt="" /></body></html>`,
    { waitUntil: "load" },
  );
  await page.screenshot({ path: dest, fullPage: false });
}

const browser = await chromium.launch();
const page = await browser.newPage();

try {
  for (const market of markets) {
    const srcDir = join(root, "dist/aso-screenshots", market);
    const outDir = join(root, "dist/asc-iphone69", market);
    mkdirSync(outDir, { recursive: true });
    for (const file of SHOTS) {
      const src = join(srcDir, file);
      if (!existsSync(src)) {
        console.error(`✗ missing ${src}`);
        process.exitCode = 1;
        continue;
      }
      const dest = join(outDir, file);
      await resizeOne(page, src, dest);
      console.log(`wrote ${dest} (${WIDTH}×${HEIGHT})`);
    }
  }
} finally {
  await browser.close();
}

if (process.exitCode) process.exit(process.exitCode);
console.log("\nApp Store iPhone 6.7\" screenshots OK");
