import { describe, expect, it } from "vitest";
import {
  getStoreCatalog,
  listStoreCatalogSummaries,
  localeToStoreMarket,
} from "./store-catalog.js";

describe("store-catalog", () => {
  it("merges listing, PPP pricing, and SKU ids", () => {
    const tw = getStoreCatalog("tw");
    expect(tw?.pricingRegion).toBe("TW");
    expect(tw?.pricing.currency).toBe("TWD");
    expect(tw?.listing.bundleId).toBe("com.ctrlz.huhu");
    expect(tw?.productIds.subscriptions).toContain(
      "com.ctrlz.huhu.sub.lite",
    );
    expect(tw?.coinPacks).toHaveLength(3);
    expect(tw?.coinPacks[0].currency).toBe("TWD");

    const vn = getStoreCatalog("vn");
    expect(vn?.pricing.currency).toBe("VND");

    const kr = getStoreCatalog("kr");
    expect(kr?.pricingRegion).toBe("KR");
    expect(kr?.pricing.currency).toBe("KRW");
  });

  it("maps locales to store markets", () => {
    expect(localeToStoreMarket("ko-KR")).toBe("kr");
    expect(localeToStoreMarket("zh-CN")).toBe("cn");
    expect(localeToStoreMarket("en-US")).toBe("us");
  });

  it("lists all market summaries", () => {
    const rows = listStoreCatalogSummaries();
    expect(rows.map((r) => r.market).sort()).toEqual([
      "cn",
      "jp",
      "kr",
      "tw",
      "us",
      "vn",
    ]);
  });
});
