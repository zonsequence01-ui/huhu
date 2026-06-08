import {
  getCoinPackPricing,
  getPricing,
  getUsdBaseline,
  listIapProductIdsByKind,
  getStoreMarket,
  localeToStoreMarket,
  STORE_MARKETS,
  type CoinPackPrice,
  type PricingRegion,
  type TierPrice,
} from "@huhu/shared";
import {
  getStoreListing,
  listStoreListingMarkets,
  type StoreListing,
} from "./store-listing.js";

/** PPP region per ASO market code. */
export const MARKET_PRICING_REGION: Record<string, PricingRegion> =
  Object.fromEntries(STORE_MARKETS.map((m) => [m.market, m.pricingRegion])) as Record<
    string,
    PricingRegion
  >;

export type StoreCatalogEntry = {
  market: string;
  locale: string;
  pricingRegion: PricingRegion;
  listing: StoreListing;
  pricing: TierPrice;
  usdBaseline: ReturnType<typeof getUsdBaseline>;
  productIds: {
    subscriptions: string[];
    coins: string[];
  };
  coinPacks: CoinPackPrice[];
};

export type StoreCatalogSummary = {
  market: string;
  locale: string;
  pricingRegion: PricingRegion;
  pricing: TierPrice;
};

const productIds = listIapProductIdsByKind();

export { localeToStoreMarket };

export function getStoreCatalog(market: string): StoreCatalogEntry | null {
  const key = market.trim().toLowerCase();
  const storeMarket = getStoreMarket(key);
  const listing = getStoreListing(key);
  if (!storeMarket || !listing) return null;
  return {
    market: key,
    locale: listing.locale,
    pricingRegion: storeMarket.pricingRegion,
    listing,
    pricing: getPricing(storeMarket.pricingRegion),
    usdBaseline: getUsdBaseline(),
    productIds,
    coinPacks: getCoinPackPricing(storeMarket.pricingRegion),
  };
}

export function listStoreCatalogSummaries(): StoreCatalogSummary[] {
  return listStoreListingMarkets().map(({ market, locale }) => {
    const pricingRegion = MARKET_PRICING_REGION[market]!;
    return {
      market,
      locale,
      pricingRegion,
      pricing: getPricing(pricingRegion),
    };
  });
}
