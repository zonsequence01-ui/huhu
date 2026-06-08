import {
  CHAT_MODES,
  COIN_COST_EXCITING_MODE,
  COIN_COST_LONG_MODE,
  DAILY_CHECKIN_COINS,
  OFFERWALL_COINS_MAX,
  OFFERWALL_COINS_MIN,
  OFFERWALL_DAILY_CAP,
  STAMINA_COST_IMAGE,
  STAMINA_COST_TEXT,
  STAMINA_COST_VOICE,
  STAMINA_MAX,
  STAMINA_RECOVER_INTERVAL_MS,
  SUBSCRIPTION_MONTHLY_COINS,
} from "./constants.js";

/** Client-facing economy rules (single source of truth). */
export function getEconomyMeta() {
  return {
    stamina: {
      max: STAMINA_MAX,
      recoverIntervalMs: STAMINA_RECOVER_INTERVAL_MS,
      costText: STAMINA_COST_TEXT,
      costVoice: STAMINA_COST_VOICE,
      costImage: STAMINA_COST_IMAGE,
    },
    coins: {
      longMode: COIN_COST_LONG_MODE,
      excitingMode: COIN_COST_EXCITING_MODE,
      dailyCheckin: DAILY_CHECKIN_COINS,
      offerwallMin: OFFERWALL_COINS_MIN,
      offerwallMax: OFFERWALL_COINS_MAX,
      offerwallDailyCap: OFFERWALL_DAILY_CAP,
      subscriptionMonthlyGrant: { ...SUBSCRIPTION_MONTHLY_COINS },
    },
    chatModes: [...CHAT_MODES],
  };
}
