import { describe, it, expect } from "vitest";
import { monthlyCoinsForTier } from "./subscription-coins.js";

describe("subscription-coins", () => {
  it("maps tier to monthly grant", () => {
    expect(monthlyCoinsForTier("lite")).toBe(30);
    expect(monthlyCoinsForTier("basic")).toBe(80);
    expect(monthlyCoinsForTier("premium")).toBe(150);
    expect(monthlyCoinsForTier("free")).toBe(0);
  });
});
