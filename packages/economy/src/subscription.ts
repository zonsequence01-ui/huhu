import type { SubscriptionTier } from "@huhu/shared";

const TIER_RANK: Record<SubscriptionTier, number> = {
  free: 0,
  lite: 1,
  basic: 2,
  premium: 3,
};

export function tierAtLeast(
  current: SubscriptionTier,
  required: SubscriptionTier,
): boolean {
  return TIER_RANK[current] >= TIER_RANK[required];
}

export function maxReplyTokens(tier: SubscriptionTier): number {
  switch (tier) {
    case "premium":
      return 4096;
    case "basic":
      return 3000;
    case "lite":
      return 1500;
    default:
      return 800;
  }
}

export function memoryRetrievalLimit(tier: SubscriptionTier): number {
  switch (tier) {
    case "premium":
      return 20;
    case "basic":
      return 16;
    case "lite":
      return 8;
    default:
      return 5;
  }
}
