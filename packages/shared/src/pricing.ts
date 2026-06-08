import { SUBSCRIPTION_PRICES_USD } from "./constants.js";

export type PricingRegion = "US" | "JP" | "TW" | "VN" | "KR" | "CN";

export interface TierPrice {
  lite: number;
  basic: number;
  premium: number;
  currency: string;
}

/** PPP reference prices from product blueprint */
export const REGION_PRICING: Record<PricingRegion, TierPrice> = {
  US: {
    lite: 9.99,
    basic: 19.99,
    premium: 29.99,
    currency: "USD",
  },
  JP: {
    lite: 1500,
    basic: 2900,
    premium: 4500,
    currency: "JPY",
  },
  TW: {
    lite: 320,
    basic: 640,
    premium: 960,
    currency: "TWD",
  },
  VN: {
    lite: 129_000,
    basic: 249_000,
    premium: 399_000,
    currency: "VND",
  },
  /** Blueprint anchor: Lite ≈ ₩12,900；Basic/Premium 依比例推算。【假設】 */
  KR: {
    lite: 12_900,
    basic: 25_900,
    premium: 39_900,
    currency: "KRW",
  },
  /** 【假設】大陆 App Store 常见档位，约 TW PPP 换算。 */
  CN: {
    lite: 68,
    basic: 128,
    premium: 198,
    currency: "CNY",
  },
};

export function getPricing(region: PricingRegion): TierPrice {
  return REGION_PRICING[region];
}

export function getUsdBaseline() {
  return SUBSCRIPTION_PRICES_USD;
}

/** Map user/character locale to PPP pricing table region. */
export function localeToPricingRegion(locale: string): PricingRegion {
  if (locale.startsWith("ja")) return "JP";
  if (locale.startsWith("ko")) return "KR";
  if (locale === "zh-CN" || locale.startsWith("zh-Hans")) return "CN";
  if (locale === "zh-TW") return "TW";
  if (locale === "vi" || locale === "vi-VN") return "VN";
  return "US";
}
