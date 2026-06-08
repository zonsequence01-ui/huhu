/**
 * Validate merged store-catalog JSON for every ASO market.
 * Requires `pnpm build` so @huhu/shared is compiled.
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  STORE_MARKETS,
  SUBSCRIPTION_PRICES_USD,
  getCoinPackPricing,
  getPricing,
  listIapProductIdsByKind,
  subscriptionProductId,
} from "@huhu/shared";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const listingsDir = join(root, "apps/api/src/data/store-listings");

function loadListing(listingFile) {
  return JSON.parse(
    readFileSync(join(listingsDir, `${listingFile}.json`), "utf8"),
  );
}

let failed = false;

function fail(msg) {
  console.error(msg);
  failed = true;
}

const productIds = listIapProductIdsByKind();
const expectedSubs = productIds.subscriptions.length;
const expectedCoins = productIds.coins.length;

for (const storeMarket of STORE_MARKETS) {
  const { market, locale, pricingRegion, listingFile } = storeMarket;
  const listing = loadListing(listingFile);
  const pricing = getPricing(pricingRegion);
  const coinPacks = getCoinPackPricing(pricingRegion);

  if (!listing.appStore?.name || !listing.googlePlay?.title) {
    fail(`${market}: listing missing appStore/googlePlay titles`);
  }
  if (!pricing.lite || !pricing.basic || !pricing.premium) {
    fail(`${market}: pricing tiers incomplete`);
  }
  if (coinPacks.length < 1) {
    fail(`${market}: no coin pack pricing`);
  }
  if (pricingRegion === "US") {
    if (
      pricing.lite !== SUBSCRIPTION_PRICES_USD.lite ||
      pricing.basic !== SUBSCRIPTION_PRICES_USD.basic ||
      pricing.premium !== SUBSCRIPTION_PRICES_USD.premium
    ) {
      fail(`${market}: US PPP must match SUBSCRIPTION_PRICES_USD`);
    }
  }
  if (productIds.subscriptions.length !== expectedSubs) {
    fail("subscription SKU count drift");
  }
  for (const tier of ["lite", "basic", "premium"]) {
    const id = subscriptionProductId(tier);
    if (!productIds.subscriptions.includes(id)) {
      fail(`${market}: missing subscription SKU ${id}`);
    }
  }
  console.log(
    `ok ${market} (${locale}) ${pricing.currency} lite=${pricing.lite} packs=${coinPacks.length}`,
  );
}

if (failed) process.exit(1);
