import { SUBSCRIPTION_TIERS, type SubscriptionTier } from "@huhu/shared";
import { buildTierEntitlements, type TierEntitlements } from "./entitlements.js";

export type SubscriptionTierCatalogEntry = {
  tier: SubscriptionTier;
  entitlements: TierEntitlements;
};

/** Public tier comparison for subscribe UI (excludes free). */
export function buildSubscriptionTierCatalog(): SubscriptionTierCatalogEntry[] {
  return SUBSCRIPTION_TIERS.filter((t) => t !== "free").map((tier) => ({
    tier,
    entitlements: buildTierEntitlements(tier),
  }));
}
