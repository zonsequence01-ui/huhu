/** Bundle ID per product blueprint */
export const BUNDLE_ID = "com.ctrlz.huhu";

/** Stamina: max 50, recover 1 per 10 minutes */
export const STAMINA_MAX = 50;
export const STAMINA_RECOVER_INTERVAL_MS = 10 * 60 * 1000;
export const STAMINA_COST_TEXT = 1;
export const STAMINA_COST_VOICE = 3;
export const STAMINA_COST_IMAGE = 2;

/** Chat modes */
export const CHAT_MODES = ["simple", "long", "exciting"] as const;

/** Coin costs for premium modes */
export const COIN_COST_LONG_MODE = 5;
export const COIN_COST_EXCITING_MODE = 10;

/** Subscription tiers */
export const SUBSCRIPTION_TIERS = ["free", "lite", "basic", "premium"] as const;

/** Relationship stages */
export const RELATIONSHIP_STAGES = [
  "stranger",
  "acquaintance",
  "ambiguous",
  "dating",
  "partner",
  "married",
] as const;

/** Affection bounds */
export const AFFECTION_MIN = 0;
export const AFFECTION_MAX = 1000;

/** Offerwall: 1–3 coins per view, max claims per calendar day */
export const OFFERWALL_COINS_MIN = 1;
export const OFFERWALL_COINS_MAX = 3;
export const OFFERWALL_DAILY_CAP = 10;

/** Daily check-in reward (blueprint: free stamina/coins via tasks) */
export const DAILY_CHECKIN_COINS = 5;

/** Monthly coin grant while subscription is active (first sync each calendar month) */
export const SUBSCRIPTION_MONTHLY_COINS = {
  lite: 30,
  basic: 80,
  premium: 150,
} as const;

/** 【假設】月訂閱週期 30 天；續訂自現有到期日疊加 */
export const SUBSCRIPTION_PERIOD_DAYS = 30;

/** PPP pricing reference (USD baseline) */
export const SUBSCRIPTION_PRICES_USD = {
  lite: 9.99,
  basic: 19.99,
  premium: 29.99,
} as const;
