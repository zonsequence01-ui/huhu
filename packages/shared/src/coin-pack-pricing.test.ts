import { describe, expect, it } from "vitest";
import { getCoinPackPricing } from "./coin-pack-pricing.js";

describe("coin-pack-pricing", () => {
  it("returns three packs per region with SKU ids", () => {
    const us = getCoinPackPricing("US");
    expect(us).toHaveLength(3);
    expect(us[0].productId).toBe("com.ctrlz.huhu.coins.small");
    expect(us[0].coins).toBe(50);
    expect(us[0].currency).toBe("USD");

    const kr = getCoinPackPricing("KR");
    expect(kr.find((p) => p.pack === "large")?.currency).toBe("KRW");
  });
});
