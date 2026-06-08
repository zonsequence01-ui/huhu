/**
 * Validate dist/store-catalog/*.json produced by export:store-catalog:files.
 * Run after `pnpm build && pnpm export:store-catalog:files`.
 */
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { STORE_MARKETS, getCoinPackPricing, subscriptionProductId } from "@huhu/shared";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = join(root, "dist/store-catalog");

let failed = false;

function fail(msg) {
  console.error(msg);
  failed = true;
}

if (!existsSync(distDir)) {
  fail(
    "dist/store-catalog missing — run: pnpm build && pnpm export:store-catalog:files",
  );
  process.exit(1);
}

const indexPath = join(distDir, "index.json");
if (!existsSync(indexPath)) {
  fail("dist/store-catalog/index.json missing");
  process.exit(1);
}

const index = JSON.parse(readFileSync(indexPath, "utf8"));
if (!Array.isArray(index.catalogs) || index.catalogs.length !== STORE_MARKETS.length) {
  fail(
    `index.json catalogs length ${index.catalogs?.length ?? 0} !== ${STORE_MARKETS.length}`,
  );
}

for (const storeMarket of STORE_MARKETS) {
  const path = join(distDir, `${storeMarket.market}.json`);
  if (!existsSync(path)) {
    fail(`missing ${path}`);
    continue;
  }
  const catalog = JSON.parse(readFileSync(path, "utf8"));
  if (catalog.market !== storeMarket.market) {
    fail(`${storeMarket.market}: market field mismatch`);
  }
  if (catalog.locale !== storeMarket.locale) {
    fail(`${storeMarket.market}: locale mismatch`);
  }
  if (!catalog.listing?.bundleId?.includes("com.ctrlz.huhu")) {
    fail(`${storeMarket.market}: bundleId missing`);
  }
  if (!catalog.pricing?.lite || !catalog.pricing?.basic || !catalog.pricing?.premium) {
    fail(`${storeMarket.market}: pricing incomplete`);
  }
  const expectedPacks = getCoinPackPricing(storeMarket.pricingRegion).length;
  if ((catalog.coinPacks?.length ?? 0) < 1) {
    fail(`${storeMarket.market}: coinPacks empty`);
  }
  if (catalog.coinPacks.length !== expectedPacks) {
    fail(
      `${storeMarket.market}: coinPacks ${catalog.coinPacks.length} !== ${expectedPacks}`,
    );
  }
  for (const tier of ["lite", "basic", "premium"]) {
    const id = subscriptionProductId(tier);
    if (!catalog.productIds?.subscriptions?.includes(id)) {
      fail(`${storeMarket.market}: missing SKU ${id}`);
    }
  }
  console.log(`ok dist ${storeMarket.market} ${catalog.pricing.currency}`);
}

if (failed) process.exit(1);
console.log("dist/store-catalog validation passed");
