import { describe, expect, it } from "vitest";
import { getPricing, localeToPricingRegion } from "./pricing.js";

describe("pricing", () => {
  it("maps locales to PPP regions", () => {
    expect(localeToPricingRegion("zh-TW")).toBe("TW");
    expect(localeToPricingRegion("ja-JP")).toBe("JP");
    expect(localeToPricingRegion("ko-KR")).toBe("KR");
    expect(localeToPricingRegion("vi-VN")).toBe("VN");
    expect(localeToPricingRegion("en-US")).toBe("US");
    expect(localeToPricingRegion("zh-CN")).toBe("CN");
  });

  it("returns KR KRW tiers", () => {
    const kr = getPricing("KR");
    expect(kr.currency).toBe("KRW");
    expect(kr.lite).toBe(12_900);
  });

  it("returns CN CNY tiers", () => {
    const cn = getPricing("CN");
    expect(cn.currency).toBe("CNY");
    expect(cn.lite).toBe(68);
  });
});
