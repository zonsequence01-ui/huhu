import { describe, expect, it } from "vitest";
import { buildOfferwallClientMeta } from "./offerwall-meta.js";
import { OFFERWALL_DAILY_CAP } from "./constants.js";

describe("buildOfferwallClientMeta", () => {
  it("uses dev_direct when verification is off", () => {
    const meta = buildOfferwallClientMeta({
      verificationRequired: false,
      webhookIpRestricted: false,
    });
    expect(meta.mode).toBe("dev_direct");
    expect(meta.verificationRequired).toBe(false);
    expect(meta.dailyCap).toBe(OFFERWALL_DAILY_CAP);
    expect(meta.coinsPerReward.min).toBeGreaterThan(0);
    expect(meta.sdkIntegration).toBe("hmac_only");
  });

  it("uses verified mode when secret is configured", () => {
    const meta = buildOfferwallClientMeta({
      verificationRequired: true,
      webhookIpRestricted: true,
    });
    expect(meta.mode).toBe("verified");
    expect(meta.webhookIpRestricted).toBe(true);
    expect(meta.endpoints.webhook).toBe("/v1/webhooks/offerwall");
  });
});
