import { describe, expect, it } from "vitest";
import {
  formatSubscriptionTierDisplayName,
  formatSubscriptionTiersPrompt,
} from "./tier-display-name.js";

describe("formatSubscriptionTierDisplayName", () => {
  it("localizes tier names", () => {
    expect(formatSubscriptionTierDisplayName("zh-TW", "lite")).toBe("輕量");
    expect(formatSubscriptionTierDisplayName("en", "basic")).toBe("Basic");
    expect(formatSubscriptionTierDisplayName("ja", "premium")).toBe("プレミアム");
    expect(formatSubscriptionTierDisplayName("ko-KR", "lite")).toMatch(/라이트|Lite/i);
  });

  it("localizes free tier", () => {
    expect(formatSubscriptionTierDisplayName("zh-TW", "free")).toBe("免費");
    expect(formatSubscriptionTierDisplayName("en", "free")).toBe("Free");
  });

  it("builds subscribe prompt", () => {
    expect(formatSubscriptionTiersPrompt("zh-TW")).toContain("輕量");
    expect(formatSubscriptionTiersPrompt("zh-TW")).toContain("基礎");
    expect(formatSubscriptionTiersPrompt("en")).toMatch(/Lite.*Basic.*Premium/);
  });
});
