import { describe, it, expect } from "vitest";
import { localeToPricingRegion } from "@huhu/shared";
import {
  buildUserPlan,
  subscriptionDaysRemaining,
} from "./user-plan.js";

describe("user-plan", () => {
  it("maps locales to PPP regions", () => {
    expect(localeToPricingRegion("zh-TW")).toBe("TW");
    expect(localeToPricingRegion("ja-JP")).toBe("JP");
    expect(localeToPricingRegion("vi-VN")).toBe("VN");
    expect(localeToPricingRegion("ko-KR")).toBe("KR");
    expect(localeToPricingRegion("zh-CN")).toBe("CN");
    expect(localeToPricingRegion("en")).toBe("US");
  });

  it("builds plan with entitlements and pricing", () => {
    const plan = buildUserPlan({
      subscriptionTier: "basic",
      subscriptionExpiresAt: new Date(
        Date.now() + 5 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      locale: "zh-TW",
    });
    expect(plan.pricingRegion).toBe("TW");
    expect(plan.pricing.currency).toBe("TWD");
    expect(plan.entitlements.voice).toBe(true);
    expect(plan.subscriptionDaysRemaining).toBeGreaterThan(0);
  });

  it("subscriptionDaysRemaining returns 0 when expired", () => {
    expect(
      subscriptionDaysRemaining(
        new Date(Date.now() - 1000).toISOString(),
      ),
    ).toBe(0);
  });
});
