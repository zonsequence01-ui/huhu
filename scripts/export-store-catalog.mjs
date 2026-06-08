/**
 * Export merged ASO + PPP + SKU catalog for store ops.
 * Requires `pnpm build` so @huhu/shared is compiled.
 *
 * Usage:
 *   node scripts/export-store-catalog.mjs           # all markets to stdout
 *   node scripts/export-store-catalog.mjs tw        # single market to stdout
 *   node scripts/export-store-catalog.mjs --out dist/store-catalog
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  STORE_MARKETS,
  getCoinPackPricing,
  getPricing,
  listIapProductIdsByKind,
} from "@huhu/shared";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const listingsDir = join(root, "apps/api/src/data/store-listings");

function loadListing(listingFile) {
  return JSON.parse(
    readFileSync(join(listingsDir, `${listingFile}.json`), "utf8"),
  );
}

function buildCatalog({ market, locale, pricingRegion, listingFile }) {
  return {
    market,
    locale,
    pricingRegion,
    listing: loadListing(listingFile),
    pricing: getPricing(pricingRegion),
    productIds: listIapProductIdsByKind(),
    coinPacks: getCoinPackPricing(pricingRegion),
  };
}

const args = process.argv.slice(2);
const outFlagIdx = args.indexOf("--out");
const outDir = outFlagIdx >= 0 ? args[outFlagIdx + 1]?.trim() : undefined;
const marketArg = args
  .filter((a, i) => a !== "--out" && i !== outFlagIdx + 1 && !a.startsWith("-"))
  .map((a) => a.toLowerCase())
  .find(Boolean);

if (outDir) {
  mkdirSync(outDir, { recursive: true });
  const markets = marketArg
    ? STORE_MARKETS.filter((m) => m.market === marketArg)
    : STORE_MARKETS;
  if (marketArg && markets.length === 0) {
    console.error(`Unknown market: ${marketArg}`);
    process.exit(1);
  }
  for (const storeMarket of markets) {
    const catalog = buildCatalog(storeMarket);
    const path = join(outDir, `${storeMarket.market}.json`);
    writeFileSync(path, JSON.stringify(catalog, null, 2));
    console.log(`wrote ${path}`);
  }
  if (!marketArg) {
    writeFileSync(
      join(outDir, "index.json"),
      JSON.stringify(
        { catalogs: markets.map(buildCatalog) },
        null,
        2,
      ),
    );
    console.log(`wrote ${join(outDir, "index.json")}`);
  }
  process.exit(0);
}

if (marketArg) {
  const storeMarket = STORE_MARKETS.find((m) => m.market === marketArg);
  if (!storeMarket) {
    console.error(`Unknown market: ${marketArg}`);
    process.exit(1);
  }
  console.log(JSON.stringify(buildCatalog(storeMarket), null, 2));
} else {
  const catalogs = STORE_MARKETS.map(buildCatalog);
  console.log(JSON.stringify({ catalogs }, null, 2));
}
