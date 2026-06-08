import type { SubscriptionTier } from "@huhu/shared";

const CHARACTER_LIMIT: Record<SubscriptionTier, number> = {
  free: 3,
  lite: 5,
  basic: 10,
  premium: 999,
};

export function maxCharactersForTier(tier: SubscriptionTier): number {
  return CHARACTER_LIMIT[tier];
}

export function canCreateCharacter(
  tier: SubscriptionTier,
  currentCount: number,
): { ok: boolean; limit: number; reason?: string } {
  const limit = maxCharactersForTier(tier);
  if (currentCount >= limit) {
    return { ok: false, limit, reason: "character_limit_reached" };
  }
  return { ok: true, limit };
}
