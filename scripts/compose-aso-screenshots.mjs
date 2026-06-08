/**
 * Overlay store listing screenshotCaptions onto captured PNGs.
 * Usage:
 *   pnpm compose:aso-screenshots
 *   pnpm compose:aso-screenshots -- --all
 *   pnpm compose:aso-screenshots -- --market=tw --target=play
 */
import { readFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { STORE_MARKETS, getStoreMarket } from "@huhu/shared";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const listingsDir = join(root, "apps/api/src/data/store-listings");

const SHOTS = [
  "01-chat.png",
  "02-modes.png",
  "03-character-creator.png",
  "04-diary.png",
  "05-subscribe.png",
  "06-privacy.png",
];

const args = process.argv.slice(2);
const allMarkets = args.includes("--all");
const marketArg = args.find((a) => a.startsWith("--market="));
const targetArg = args.find((a) => a.startsWith("--target="));
const target = targetArg?.split("=")[1] ?? "both";

const markets = allMarkets
  ? STORE_MARKETS.map((m) => m.market)
  : [marketArg?.split("=")[1] ?? "tw"];

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function composeOne(page, inputPath, outputPath, caption, width, height) {
  const b64 = readFileSync(inputPath).toString("base64");
  await page.setViewportSize({ width, height });
  await page.setContent(
    `<!DOCTYPE html><html><head><style>
      * { margin:0; padding:0; box-sizing:border-box; }
      html, body { width:${width}px; height:${height}px; overflow:hidden; background:#0f0f14; font-family:system-ui,Segoe UI,sans-serif; }
      .wrap { position:relative; width:100%; height:100%; }
      img { width:100%; height:100%; object-fit:cover; object-position:top center; display:block; }
      .bar {
        position:absolute; left:0; right:0; bottom:0;
        padding:28px 32px 36px;
        background:linear-gradient(transparent, rgba(8,8,14,0.92) 35%, rgba(8,8,14,0.98));
      }
      .caption {
        color:#fff;
        font-size:${width >= 1200 ? 42 : 36}px;
        font-weight:700;
        line-height:1.25;
        text-shadow:0 2px 12px rgba(0,0,0,0.45);
      }
    </style></head><body>
      <div class="wrap">
        <img src="data:image/png;base64,${b64}" alt="" />
        <div class="bar"><div class="caption">${escapeHtml(caption)}</div></div>
      </div>
    </body></html>`,
    { waitUntil: "load" },
  );
  await page.screenshot({ path: outputPath, fullPage: false });
}

async function composeMarket(market, page) {
  const meta = getStoreMarket(market);
  if (!meta) throw new Error(`unknown market: ${market}`);
  const listing = JSON.parse(
    readFileSync(join(listingsDir, `${meta.listingFile}.json`), "utf8"),
  );
  const captions = listing.screenshotCaptions ?? [];
  if (captions.length !== SHOTS.length) {
    throw new Error(`${market}: expected ${SHOTS.length} captions, got ${captions.length}`);
  }

  const jobs = [];
  if (target === "app" || target === "both") {
    const ascSrc = join(root, "dist/asc-iphone69", market);
    const src = existsSync(join(ascSrc, "01-chat.png"))
      ? ascSrc
      : join(root, "dist/aso-screenshots", market);
    const out = join(root, "dist/aso-screenshots-captioned", market);
    mkdirSync(out, { recursive: true });
    for (let i = 0; i < SHOTS.length; i++) {
      jobs.push({
        src: join(src, SHOTS[i]),
        out: join(out, SHOTS[i]),
        caption: captions[i],
        w: 1284,
        h: 2778,
        label: `app ${SHOTS[i]}`,
      });
    }
  }
  if (target === "play" || target === "both") {
    const src = join(root, "dist/aso-screenshots-play", market);
    const out = join(root, "dist/aso-screenshots-play-captioned", market);
    mkdirSync(out, { recursive: true });
    for (let i = 0; i < SHOTS.length; i++) {
      jobs.push({
        src: join(src, SHOTS[i]),
        out: join(out, SHOTS[i]),
        caption: captions[i],
        w: 1080,
        h: 1920,
        label: `play ${SHOTS[i]}`,
      });
    }
  }

  for (const job of jobs) {
    if (!existsSync(job.src)) {
      console.error(`✗ missing ${job.src}`);
      process.exitCode = 1;
      continue;
    }
    await composeOne(page, job.src, job.out, job.caption, job.w, job.h);
    console.log(`wrote ${job.out} (${job.label})`);
  }
}

const browser = await chromium.launch();
const page = await browser.newPage();

try {
  for (const market of markets) {
    console.log(`\n=== ${market} captions ===`);
    await composeMarket(market, page);
  }
  console.log("\nDone. Captioned PNG in dist/aso-screenshots-captioned/ and dist/aso-screenshots-play-captioned/");
} finally {
  await browser.close();
}

if (process.exitCode) process.exit(process.exitCode);
