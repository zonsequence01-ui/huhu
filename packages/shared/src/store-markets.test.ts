import { describe, expect, it } from "vitest";
import {
  STORE_MARKETS,
  getStoreMarket,
  localeToStoreMarket,
} from "./store-markets.js";

describe("store-markets", () => {
  it("lists six ASO markets", () => {
    expect(STORE_MARKETS.map((m) => m.market).sort()).toEqual([
      "cn",
      "jp",
      "kr",
      "tw",
      "us",
      "vn",
    ]);
  });

  it("resolves market metadata", () => {
    expect(getStoreMarket("JP")?.pricingRegion).toBe("JP");
    expect(getStoreMarket("unknown")).toBeUndefined();
  });

  it("maps client locales to store markets", () => {
    expect(localeToStoreMarket("zh-TW")).toBe("tw");
    expect(localeToStoreMarket("ko-KR")).toBe("kr");
    expect(localeToStoreMarket("zh-CN")).toBe("cn");
    expect(localeToStoreMarket("en-US")).toBe("us");
    expect(localeToStoreMarket("ja-JP")).toBe("jp");
    expect(localeToStoreMarket("vi-VN")).toBe("vn");
    expect(localeToStoreMarket("fr-FR")).toBeNull();
  });
});
