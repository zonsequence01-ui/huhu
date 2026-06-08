import { BUNDLE_ID } from "./constants.js";
import type { SubscriptionTier } from "./types.js";

export type IapGrant =
  | { kind: "subscription"; tier: Exclude<SubscriptionTier, "free"> }
  | { kind: "coins"; amount: number };

export const IAP_SUBSCRIPTION_PRODUCT_IDS = {
  lite: `${BUNDLE_ID}.sub.lite`,
  basic: `${BUNDLE_ID}.sub.basic`,
  premium: `${BUNDLE_ID}.sub.premium`,
} as const;

/** App Store Connect subscriptions created without `.sub.` segment (cannot rename after create). */
export const IAP_SUBSCRIPTION_LEGACY_IOS_IDS = {
  lite: `${BUNDLE_ID}.lite`,
  basic: `${BUNDLE_ID}.basic`,
  premium: `${BUNDLE_ID}.premium`,
} as const;

export type IapClientPlatform = "ios" | "android" | "web";

export const IAP_COIN_PRODUCT_IDS = {
  small: `${BUNDLE_ID}.coins.small`,
  medium: `${BUNDLE_ID}.coins.medium`,
  large: `${BUNDLE_ID}.coins.large`,
} as const;

const SUBSCRIPTION_GRANTS = {
  lite: { kind: "subscription", tier: "lite" } as const,
  basic: { kind: "subscription", tier: "basic" } as const,
  premium: { kind: "subscription", tier: "premium" } as const,
};

export const IAP_PRODUCTS: Record<string, IapGrant> = {
  [IAP_SUBSCRIPTION_PRODUCT_IDS.lite]: SUBSCRIPTION_GRANTS.lite,
  [IAP_SUBSCRIPTION_PRODUCT_IDS.basic]: SUBSCRIPTION_GRANTS.basic,
  [IAP_SUBSCRIPTION_PRODUCT_IDS.premium]: SUBSCRIPTION_GRANTS.premium,
  [IAP_SUBSCRIPTION_LEGACY_IOS_IDS.lite]: SUBSCRIPTION_GRANTS.lite,
  [IAP_SUBSCRIPTION_LEGACY_IOS_IDS.basic]: SUBSCRIPTION_GRANTS.basic,
  [IAP_SUBSCRIPTION_LEGACY_IOS_IDS.premium]: SUBSCRIPTION_GRANTS.premium,
  [IAP_COIN_PRODUCT_IDS.small]: { kind: "coins", amount: 50 },
  [IAP_COIN_PRODUCT_IDS.medium]: { kind: "coins", amount: 150 },
  [IAP_COIN_PRODUCT_IDS.large]: { kind: "coins", amount: 400 },
};

/** One-time bonus coins granted on first subscription purchase. */
const SUBSCRIPTION_BONUS_COINS: Partial<
  Record<SubscriptionTier, number>
> = {
  lite: 20,
  basic: 50,
  premium: 100,
};

export function subscriptionBonusCoins(tier: SubscriptionTier): number {
  return SUBSCRIPTION_BONUS_COINS[tier] ?? 0;
}

export function subscriptionProductId(
  tier: Exclude<SubscriptionTier, "free">,
): string {
  return IAP_SUBSCRIPTION_PRODUCT_IDS[tier];
}

export function subscriptionProductIdForPlatform(
  tier: Exclude<SubscriptionTier, "free">,
  platform?: IapClientPlatform,
): string {
  if (platform === "ios") {
    return IAP_SUBSCRIPTION_LEGACY_IOS_IDS[tier];
  }
  return IAP_SUBSCRIPTION_PRODUCT_IDS[tier];
}

export function isLegacyIosSubscriptionProductId(productId: string): boolean {
  return Object.values(IAP_SUBSCRIPTION_LEGACY_IOS_IDS).includes(
    productId as (typeof IAP_SUBSCRIPTION_LEGACY_IOS_IDS)[keyof typeof IAP_SUBSCRIPTION_LEGACY_IOS_IDS],
  );
}

export function coinPackProductId(
  pack: keyof typeof IAP_COIN_PRODUCT_IDS,
): string {
  return IAP_COIN_PRODUCT_IDS[pack];
}

export function listIapProductIds(): string[] {
  return Object.keys(IAP_PRODUCTS).sort();
}

export function listIapProductIdsByKind(): {
  subscriptions: string[];
  coins: string[];
} {
  const subscriptions: string[] = [];
  const coins: string[] = [];
  for (const productId of Object.keys(IAP_PRODUCTS)) {
    if (productId.includes(".sub.")) subscriptions.push(productId);
    else if (productId.includes(".coins.")) coins.push(productId);
  }
  return { subscriptions, coins };
}
