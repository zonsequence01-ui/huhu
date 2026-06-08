import { coinPackProductId } from "./iap-products.js";
import type { PricingRegion } from "./pricing.js";

export type CoinPackId = "small" | "medium" | "large";

export type CoinPackPrice = {
  productId: string;
  pack: CoinPackId;
  coins: number;
  price: number;
  currency: string;
};

/** USD reference; regional tiers scaled for PPP.【假設】 */
const COIN_PACK_USD: Record<CoinPackId, number> = {
  small: 1.99,
  medium: 4.99,
  large: 9.99,
};

const COIN_AMOUNTS: Record<CoinPackId, number> = {
  small: 50,
  medium: 150,
  large: 400,
};

const REGION_COIN_PRICES: Record<
  PricingRegion,
  Record<CoinPackId, { price: number; currency: string }>
> = {
  US: {
    small: { price: 1.99, currency: "USD" },
    medium: { price: 4.99, currency: "USD" },
    large: { price: 9.99, currency: "USD" },
  },
  JP: {
    small: { price: 300, currency: "JPY" },
    medium: { price: 750, currency: "JPY" },
    large: { price: 1500, currency: "JPY" },
  },
  TW: {
    small: { price: 60, currency: "TWD" },
    medium: { price: 150, currency: "TWD" },
    large: { price: 300, currency: "TWD" },
  },
  VN: {
    small: { price: 49_000, currency: "VND" },
    medium: { price: 129_000, currency: "VND" },
    large: { price: 249_000, currency: "VND" },
  },
  KR: {
    small: { price: 2_500, currency: "KRW" },
    medium: { price: 6_500, currency: "KRW" },
    large: { price: 13_000, currency: "KRW" },
  },
  CN: {
    small: { price: 12, currency: "CNY" },
    medium: { price: 30, currency: "CNY" },
    large: { price: 68, currency: "CNY" },
  },
};

export function getCoinPackPricing(region: PricingRegion): CoinPackPrice[] {
  const table = REGION_COIN_PRICES[region];
  return (["small", "medium", "large"] as const).map((pack) => ({
    productId: coinPackProductId(pack),
    pack,
    coins: COIN_AMOUNTS[pack],
    price: table[pack].price,
    currency: table[pack].currency,
  }));
}

export function getCoinPackUsdReference() {
  return { ...COIN_PACK_USD };
}
