import type { SubscriptionTier } from "@huhu/shared";
import {
  tierAtLeast,
  maxReplyTokens,
  memoryRetrievalLimit,
} from "./subscription.js";
import { maxCharactersForTier } from "./character-limit.js";

export function canUseVoice(tier: SubscriptionTier): boolean {
  return tierAtLeast(tier, "basic");
}

/** Premium tier: fewer content guardrails in prompts (store policy still applies). */
export function hasPremiumContentTier(tier: SubscriptionTier): boolean {
  return tier === "premium";
}

export interface TierEntitlements {
  unlimitedStamina: boolean;
  voice: boolean;
  premiumContent: boolean;
  maxCharacters: number;
  memoryRetrievalLimit: number;
  maxReplyTokens: number;
}

export function buildTierEntitlements(tier: SubscriptionTier): TierEntitlements {
  return {
    unlimitedStamina: tier !== "free",
    voice: canUseVoice(tier),
    premiumContent: hasPremiumContentTier(tier),
    maxCharacters: maxCharactersForTier(tier),
    memoryRetrievalLimit: memoryRetrievalLimit(tier),
    maxReplyTokens: maxReplyTokens(tier),
  };
}
