import { describe, expect, it } from "vitest";
import {
  IAP_PRODUCTS,
  IAP_SUBSCRIPTION_LEGACY_IOS_IDS,
  listIapProductIdsByKind,
  subscriptionBonusCoins,
  subscriptionProductId,
  subscriptionProductIdForPlatform,
} from "./iap-products.js";

describe("IAP_PRODUCTS", () => {
  it("maps all subscription tiers and coin packs", () => {
    expect(Object.keys(IAP_PRODUCTS).sort()).toEqual([
      "com.ctrlz.huhu.basic",
      "com.ctrlz.huhu.coins.large",
      "com.ctrlz.huhu.coins.medium",
      "com.ctrlz.huhu.coins.small",
      "com.ctrlz.huhu.lite",
      "com.ctrlz.huhu.premium",
      "com.ctrlz.huhu.sub.basic",
      "com.ctrlz.huhu.sub.lite",
      "com.ctrlz.huhu.sub.premium",
    ]);
    expect(IAP_PRODUCTS["com.ctrlz.huhu.sub.lite"]).toEqual({
      kind: "subscription",
      tier: "lite",
    });
    expect(IAP_PRODUCTS[IAP_SUBSCRIPTION_LEGACY_IOS_IDS.lite]).toEqual({
      kind: "subscription",
      tier: "lite",
    });
    expect(IAP_PRODUCTS["com.ctrlz.huhu.coins.small"]).toEqual({
      kind: "coins",
      amount: 50,
    });
  });

  it("returns purchase bonus coins per tier", () => {
    expect(subscriptionBonusCoins("lite")).toBe(20);
    expect(subscriptionBonusCoins("basic")).toBe(50);
    expect(subscriptionBonusCoins("premium")).toBe(100);
    expect(subscriptionBonusCoins("free")).toBe(0);
  });

  it("builds subscription product ids", () => {
    expect(subscriptionProductId("basic")).toBe("com.ctrlz.huhu.sub.basic");
    expect(subscriptionProductIdForPlatform("lite", "ios")).toBe(
      "com.ctrlz.huhu.lite",
    );
    expect(subscriptionProductIdForPlatform("lite", "android")).toBe(
      "com.ctrlz.huhu.sub.lite",
    );
    const { subscriptions, coins } = listIapProductIdsByKind();
    expect(subscriptions).toHaveLength(3);
    expect(coins).toHaveLength(3);
  });
});
