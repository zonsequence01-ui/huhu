/**
 * Ensure every STORE_MARKETS entry has a valid listing JSON on disk.
 * Requires `pnpm build` so @huhu/shared is compiled.
 */
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { BUNDLE_ID, STORE_MARKETS } from "@huhu/shared";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const listingsDir = join(root, "apps/api/src/data/store-listings");

/** @param {unknown} v */
function nonEmptyString(v, label) {
  if (typeof v !== "string" || !v.trim()) {
    throw new Error(`${label} must be a non-empty string`);
  }
}

/**
 * @param {string} market
 * @param {unknown} data
 */
function validateListingShape(market, data) {
  if (!data || typeof data !== "object") {
    throw new Error("root must be an object");
  }
  const listing = /** @type {Record<string, unknown>} */ (data);
  if (listing.market !== market) {
    throw new Error(`market field must be "${market}"`);
  }
  nonEmptyString(listing.locale, "locale");
  if (listing.bundleId !== BUNDLE_ID) {
    throw new Error(`bundleId must be ${BUNDLE_ID}`);
  }
  nonEmptyString(listing.ageRating, "ageRating");

  const appStore = listing.appStore;
  if (!appStore || typeof appStore !== "object") {
    throw new Error("appStore required");
  }
  const as = /** @type {Record<string, unknown>} */ (appStore);
  for (const key of [
    "name",
    "subtitle",
    "keywords",
    "promotionalText",
    "description",
  ]) {
    nonEmptyString(as[key], `appStore.${key}`);
  }
  const name = /** @type {string} */ (as.name);
  const subtitle = /** @type {string} */ (as.subtitle);
  const keywords = /** @type {string} */ (as.keywords);
  const promo = /** @type {string} */ (as.promotionalText);
  if (name.length > 30) {
    throw new Error(`appStore.name exceeds 30 chars (${name.length})`);
  }
  if (subtitle.length > 30) {
    throw new Error(`appStore.subtitle exceeds 30 chars (${subtitle.length})`);
  }
  if (keywords.length > 100) {
    throw new Error(`appStore.keywords exceeds 100 chars (${keywords.length})`);
  }
  if (promo.length > 170) {
    throw new Error(
      `appStore.promotionalText exceeds 170 chars (${promo.length})`,
    );
  }

  const googlePlay = listing.googlePlay;
  if (!googlePlay || typeof googlePlay !== "object") {
    throw new Error("googlePlay required");
  }
  const gp = /** @type {Record<string, unknown>} */ (googlePlay);
  for (const key of ["title", "shortDescription", "fullDescription"]) {
    nonEmptyString(gp[key], `googlePlay.${key}`);
  }
  const gpTitle = /** @type {string} */ (gp.title);
  const gpShort = /** @type {string} */ (gp.shortDescription);
  if (gpTitle.length > 30) {
    throw new Error(`googlePlay.title exceeds 30 chars (${gpTitle.length})`);
  }
  if (gpShort.length > 80) {
    throw new Error(
      `googlePlay.shortDescription exceeds 80 chars (${gpShort.length})`,
    );
  }

  const captions = listing.screenshotCaptions;
  if (!Array.isArray(captions) || captions.length < 3) {
    throw new Error("screenshotCaptions must be an array with at least 3 items");
  }
  for (let i = 0; i < captions.length; i++) {
    nonEmptyString(captions[i], `screenshotCaptions[${i}]`);
  }
}

let failed = false;
for (const { market, listingFile } of STORE_MARKETS) {
  const path = join(listingsDir, `${listingFile}.json`);
  if (!existsSync(path)) {
    console.error(`missing listing for market=${market}: ${path}`);
    failed = true;
    continue;
  }
  try {
    const data = JSON.parse(readFileSync(path, "utf8"));
    validateListingShape(market, data);
    console.log(`ok ${market} -> ${listingFile}.json`);
  } catch (err) {
    console.error(`invalid ${market} (${listingFile}.json): ${err.message}`);
    failed = true;
  }
}

if (failed) process.exit(1);
