/**
 * Validate captured ASO screenshot PNGs exist.
 * Usage: pnpm validate:aso-screenshots [--market=tw]
 */
import { existsSync, statSync } from "node:fs";
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

const REQUIRED = [
  "01-chat.png",
  "02-modes.png",
  "03-character-creator.png",
  "04-diary.png",
  "05-subscribe.png",
  "06-privacy.png",
];

let failed = false;

for (const market of markets) {
  const dir = join(root, "dist/aso-screenshots", market);
  for (const file of REQUIRED) {
    const path = join(dir, file);
    if (!existsSync(path)) {
      console.error(`✗ missing ${path}`);
      failed = true;
      continue;
    }
    const size = statSync(path).size;
    if (size < 10_000) {
      console.error(`✗ too small (${size} bytes): ${path}`);
      failed = true;
      continue;
    }
    console.log(`✓ ${path} (${Math.round(size / 1024)} KB)`);
  }
}

if (failed) {
  console.error("\nRun: pnpm capture:aso-screenshots -- --all");
  process.exit(1);
}

console.log("\nASO screenshots OK");
