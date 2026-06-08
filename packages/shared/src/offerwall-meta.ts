import {
  OFFERWALL_COINS_MAX,
  OFFERWALL_COINS_MIN,
  OFFERWALL_DAILY_CAP,
} from "./constants.js";

/** How the client should claim offerwall rewards. */
export type OfferwallClientMode = "dev_direct" | "verified";

export type OfferwallClientMeta = {
  mode: OfferwallClientMode;
  verificationRequired: boolean;
  webhookIpRestricted: boolean;
  dailyCap: number;
  coinsPerReward: { min: number; max: number };
  endpoints: {
    prepare: string;
    claim: string;
    webhook: string;
  };
  /** No bundled third-party SDK; use HMAC webhook or prepare+claim. */
  sdkIntegration: "hmac_only";
};

export function buildOfferwallClientMeta(options: {
  verificationRequired: boolean;
  webhookIpRestricted: boolean;
}): OfferwallClientMeta {
  const { verificationRequired, webhookIpRestricted } = options;
  return {
    mode: verificationRequired ? "verified" : "dev_direct",
    verificationRequired,
    webhookIpRestricted,
    dailyCap: OFFERWALL_DAILY_CAP,
    coinsPerReward: {
      min: OFFERWALL_COINS_MIN,
      max: OFFERWALL_COINS_MAX,
    },
    endpoints: {
      prepare: "/v1/rewards/offerwall/prepare",
      claim: "/v1/rewards/offerwall",
      webhook: "/v1/webhooks/offerwall",
    },
    sdkIntegration: "hmac_only",
  };
}
