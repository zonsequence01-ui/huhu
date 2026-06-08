import { describe, expect, it } from "vitest";
import { verifyReceipt } from "./iap.js";

describe("verifyReceipt", () => {
  it("accepts dev receipt valid_product", () => {
    const r = verifyReceipt({
      platform: "ios",
      productId: "com.ctrlz.huhu.sub.lite",
      receipt: "valid_com.ctrlz.huhu.sub.lite",
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.grant).toEqual({ kind: "subscription", tier: "lite" });
      expect(r.bonusCoins).toBe(20);
    }
  });

  it("rejects unknown product", () => {
    const r = verifyReceipt({
      platform: "android",
      productId: "com.example.unknown",
      receipt: "valid_com.example.unknown",
    });
    expect(r.ok).toBe(false);
  });
});
