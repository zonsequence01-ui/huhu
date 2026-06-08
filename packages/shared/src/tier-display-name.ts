import type { SubscriptionTier } from "./types.js";
import { SUBSCRIPTION_TIERS } from "./constants.js";
import { normalizeClientLocale } from "./locales.js";
import { tUi } from "./ui-strings.js";

const TIER_NAME_KEYS: Partial<
  Record<Exclude<SubscriptionTier, "free">, "tierNameLite" | "tierNameBasic" | "tierNamePremium">
> = {
  lite: "tierNameLite",
  basic: "tierNameBasic",
  premium: "tierNamePremium",
};

/** Localized marketing name for subscribe UI (Lite / Basic / Premium). */
export function formatSubscriptionTierDisplayName(
  locale: string,
  tier: SubscriptionTier,
): string {
  if (tier === "free") {
    return tUi(normalizeClientLocale(locale), "tierNameFree");
  }
  const key = TIER_NAME_KEYS[tier as Exclude<SubscriptionTier, "free">];
  if (!key) return tier;
  return tUi(normalizeClientLocale(locale), key);
}

const PAID_TIERS = SUBSCRIPTION_TIERS.filter(
  (t): t is Exclude<SubscriptionTier, "free"> => t !== "free",
);

/** e.g. "輕量 / 基礎 / 尊榮" for subscribe dialog hints. */
export function formatSubscriptionTiersList(locale: string): string {
  return PAID_TIERS.map((tier) =>
    formatSubscriptionTierDisplayName(locale, tier),
  ).join(" / ");
}

/** e.g. "訂閱方案：輕量 / 基礎 / 尊榮". */
export function formatSubscriptionTiersPrompt(locale: string): string {
  const loc = normalizeClientLocale(locale);
  return `${tUi(loc, "subscribePromptPrefix")}${formatSubscriptionTiersList(loc)}`;
}
