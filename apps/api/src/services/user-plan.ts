import type { SubscriptionTier } from "@huhu/shared";
import {
  getPricing,
  isSubscriptionExpired,
  localeToPricingRegion,
  type PricingRegion,
} from "@huhu/shared";
import { buildTierEntitlements } from "@huhu/economy";

export function subscriptionDaysRemaining(
  expiresAt: string | null | undefined,
  now = new Date(),
): number | null {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - now.getTime();
  if (ms <= 0) return 0;
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

export function buildUserPlan(user: {
  subscriptionTier: string;
  subscriptionExpiresAt: string | null;
  locale: string;
}) {
  const tier = user.subscriptionTier as SubscriptionTier;
  const region: PricingRegion = localeToPricingRegion(user.locale);
  const expired = isSubscriptionExpired(user.subscriptionExpiresAt);
  return {
    tier,
    subscriptionExpired: expired,
    subscriptionExpiresAt: user.subscriptionExpiresAt,
    subscriptionDaysRemaining: subscriptionDaysRemaining(
      user.subscriptionExpiresAt,
    ),
    pricingRegion: region,
    pricing: getPricing(region),
    entitlements: buildTierEntitlements(tier),
  };
}
