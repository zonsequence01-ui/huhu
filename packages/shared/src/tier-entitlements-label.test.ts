import { describe, expect, it } from "vitest";
import { SUPPORTED_LOCALES } from "./locales.js";
import { getUiStrings } from "./ui-strings.js";
import { formatTierEntitlementsLabel } from "./tier-entitlements-label.js";

const TIER_ENT_KEYS = [
  "tierEntUnlimitedStamina",
  "tierEntVoice",
  "tierEntMemory",
  "tierEntReply",
  "tierEntPremium",
  "tierEntCharacters",
  "tierNameFree",
  "subscribePppHint",
] as const;

describe("tier entitlement ui strings", () => {
  for (const { id } of SUPPORTED_LOCALES) {
    it(`defines tier keys for ${id}`, () => {
      const table = getUiStrings(id);
      for (const key of TIER_ENT_KEYS) {
        expect(table[key]?.length).toBeGreaterThan(0);
      }
    });
  }
});

describe("formatTierEntitlementsLabel", () => {
  it("formats zh-TW basic entitlements", () => {
    const label = formatTierEntitlementsLabel("zh-TW", {
      unlimitedStamina: true,
      voice: true,
      memoryRetrievalLimit: 16,
      maxReplyTokens: 3000,
    });
    expect(label).toContain("無限體力");
    expect(label).toContain("語音");
    expect(label).toContain("16");
    expect(label).toContain("3000");
  });

  it("formats maxCharacters", () => {
    const label = formatTierEntitlementsLabel("zh-TW", {
      maxCharacters: 10,
    });
    expect(label).toContain("角色上限");
    expect(label).toContain("10");
  });

  it("formats en premium with premium flag", () => {
    const label = formatTierEntitlementsLabel("en-US", {
      unlimitedStamina: true,
      premiumContent: true,
      memoryRetrievalLimit: 20,
      maxReplyTokens: 4096,
    });
    expect(label.toLowerCase()).toContain("premium");
    expect(label).toContain("20");
  });
});
