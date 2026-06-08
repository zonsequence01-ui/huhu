import { describe, expect, it } from "vitest";
import { buildSubscriptionTierCatalog } from "./subscription-catalog.js";

describe("buildSubscriptionTierCatalog", () => {
  it("lists paid tiers with entitlements", () => {
    const catalog = buildSubscriptionTierCatalog();
    expect(catalog.map((e) => e.tier)).toEqual(["lite", "basic", "premium"]);
    const basic = catalog.find((e) => e.tier === "basic");
    expect(basic?.entitlements.voice).toBe(true);
    expect(basic?.entitlements.unlimitedStamina).toBe(true);
    const premium = catalog.find((e) => e.tier === "premium");
    expect(premium?.entitlements.premiumContent).toBe(true);
  });
});
