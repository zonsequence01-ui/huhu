import { describe, expect, it } from "vitest";
import { buildClientConfigMeta } from "./client-config-meta.js";

describe("buildClientConfigMeta", () => {
  it("bundles economy, offerwall, and locale support resources", () => {
    const meta = buildClientConfigMeta("en-US", {
      verificationRequired: false,
      webhookIpRestricted: false,
    });
    expect(meta.economy.stamina.max).toBe(50);
    expect(meta.offerwall.mode).toBe("dev_direct");
    expect(meta.supportResources.region).toBe("US");
    expect(meta.supportResources.privacyReminder.length).toBeGreaterThan(10);
    expect(meta.storeUrls.support).toMatch(/\/support$/);
    expect(meta.storeUrls.privacy).toMatch(/\/privacy$/);
  });
});
