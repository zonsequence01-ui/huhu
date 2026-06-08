import { describe, expect, it } from "vitest";
import { buildSystemPrompt } from "./prompts.js";

describe("buildSystemPrompt", () => {
  const base = {
    name: "Mia",
    personality: "warm",
    backstory: "student",
    speakingStyle: "casual",
    locale: "ja-JP",
  };

  it("includes Japanese cultural hint and stage behavior", () => {
    const prompt = buildSystemPrompt(base, "stranger", []);
    expect(prompt).toContain("敬語");
    expect(prompt).toContain("丁寧語");
  });

  it("includes premium unrestricted line when enabled", () => {
    const prompt = buildSystemPrompt(base, "dating", [], {
      premiumUnrestricted: true,
    });
    expect(prompt).toContain("Premium");
  });
});
