import { describe, expect, it } from "vitest";
import { canUseVoice, hasPremiumContentTier } from "./entitlements.js";

describe("entitlements", () => {
  it("voice requires basic+", () => {
    expect(canUseVoice("free")).toBe(false);
    expect(canUseVoice("lite")).toBe(false);
    expect(canUseVoice("basic")).toBe(true);
  });

  it("premium content tier", () => {
    expect(hasPremiumContentTier("premium")).toBe(true);
    expect(hasPremiumContentTier("basic")).toBe(false);
  });
});
