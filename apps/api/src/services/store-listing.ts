import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { STORE_MARKETS } from "@huhu/shared";
export type StoreListing = {
  market: string;
  locale: string;
  bundleId: string;
  appStore: {
    name: string;
    subtitle: string;
    keywords: string;
    promotionalText: string;
    description: string;
  };
  googlePlay: {
    title: string;
    shortDescription: string;
    fullDescription: string;
  };
  screenshotCaptions: string[];
  ageRating: string;
};

const DATA_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "../data/store-listings",
);

const MARKET_ALIASES: Record<string, string> = {
  tw: "zh-TW",
  "zh-tw": "zh-TW",
  us: "en",
  en: "en",
  "en-us": "en",
  jp: "ja",
  ja: "ja",
  kr: "ko",
  ko: "ko",
  vn: "vi",
  vi: "vi",
  cn: "zh-CN",
  "zh-cn": "zh-CN",
};

const cache = new Map<string, StoreListing>();

function loadFile(localeFile: string): StoreListing {
  const cached = cache.get(localeFile);
  if (cached) return cached;
  const raw = readFileSync(join(DATA_DIR, `${localeFile}.json`), "utf8");
  const parsed = JSON.parse(raw) as StoreListing;
  cache.set(localeFile, parsed);
  return parsed;
}

export function resolveStoreListingMarket(raw: string): string | null {
  const key = raw.trim().toLowerCase();
  return MARKET_ALIASES[key] ?? null;
}

const LISTING_FILE: Record<string, string> = {
  "zh-TW": "zh-TW",
  "zh-CN": "zh-CN",
  en: "en",
  ja: "ja",
  ko: "ko",
  vi: "vi",
};

export function getStoreListing(marketOrLocale: string): StoreListing | null {
  const localeKey = resolveStoreListingMarket(marketOrLocale);
  if (!localeKey) return null;
  const file = LISTING_FILE[localeKey];
  if (!file) return null;
  return loadFile(file);
}

export function listStoreListingMarkets(): { market: string; locale: string }[] {
  return STORE_MARKETS.map(({ market, locale }) => ({ market, locale }));
}
