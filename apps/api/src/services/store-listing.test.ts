import { describe, expect, it } from "vitest";
import {
  getStoreListing,
  listStoreListingMarkets,
  resolveStoreListingMarket,
} from "./store-listing.js";

describe("store-listing", () => {
  it("resolves market aliases", () => {
    expect(resolveStoreListingMarket("tw")).toBe("zh-TW");
    expect(resolveStoreListingMarket("JP")).toBe("ja");
    expect(resolveStoreListingMarket("vn")).toBe("vi");
    expect(resolveStoreListingMarket("cn")).toBe("zh-CN");
    expect(resolveStoreListingMarket("xx")).toBeNull();
  });

  it("loads listing JSON per market", () => {
    const tw = getStoreListing("tw");
    expect(tw?.bundleId).toBe("com.ctrlz.huhu");
    expect(tw?.appStore.name).toContain("呼呼");
    const en = getStoreListing("us");
    expect(en?.locale).toBe("en");
    expect(en?.googlePlay.title.length).toBeGreaterThan(3);
  });

  it("lists ASO markets", () => {
    const markets = listStoreListingMarkets();
    expect(markets.map((m) => m.market)).toEqual([
      "tw",
      "us",
      "jp",
      "kr",
      "vn",
      "cn",
    ]);
  });
});
