import type { PricingRegion } from "./pricing.js";

export type StoreMarket = {
  market: string;
  locale: string;
  pricingRegion: PricingRegion;
  listingFile: string;
};

/** ASO market codes aligned with `apps/api/src/data/store-listings/*.json`. */
export const STORE_MARKETS: StoreMarket[] = [
  { market: "tw", locale: "zh-TW", pricingRegion: "TW", listingFile: "zh-TW" },
  { market: "us", locale: "en", pricingRegion: "US", listingFile: "en" },
  { market: "jp", locale: "ja-JP", pricingRegion: "JP", listingFile: "ja" },
  { market: "kr", locale: "ko-KR", pricingRegion: "KR", listingFile: "ko" },
  { market: "vn", locale: "vi-VN", pricingRegion: "VN", listingFile: "vi" },
  { market: "cn", locale: "zh-CN", pricingRegion: "CN", listingFile: "zh-CN" },
];

export function getStoreMarket(market: string): StoreMarket | undefined {
  return STORE_MARKETS.find((m) => m.market === market.trim().toLowerCase());
}

/** ASO / store-catalog market code for a client locale (BCP-47). */
export function localeToStoreMarket(locale: string): string | null {
  const normalized = locale.trim();
  const exact = STORE_MARKETS.find((m) => m.locale === normalized);
  if (exact) return exact.market;
  if (normalized === "zh-TW" || normalized === "zh-Hant") return "tw";
  if (normalized.startsWith("ja")) return "jp";
  if (normalized.startsWith("ko")) return "kr";
  if (normalized === "vi" || normalized.startsWith("vi")) return "vn";
  if (normalized === "zh-CN" || normalized.startsWith("zh-Hans")) return "cn";
  if (normalized.startsWith("en")) return "us";
  return null;
}
