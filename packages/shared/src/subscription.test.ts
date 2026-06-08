import { describe, it, expect } from "vitest";
import { extendSubscriptionExpiry, isSubscriptionExpired } from "./subscription.js";

describe("subscription expiry", () => {
  it("extends from now when no prior expiry", () => {
    const at = extendSubscriptionExpiry(null, new Date("2025-01-01T00:00:00Z"));
    expect(at).toBe("2025-01-31T00:00:00.000Z");
  });

  it("stacks renewal from existing future expiry", () => {
    const at = extendSubscriptionExpiry(
      "2025-02-15T00:00:00Z",
      new Date("2025-01-01T00:00:00Z"),
    );
    expect(at).toBe("2025-03-17T00:00:00.000Z");
  });

  it("detects expired subscriptions", () => {
    expect(isSubscriptionExpired("2020-01-01", new Date("2025-01-01"))).toBe(
      true,
    );
    expect(isSubscriptionExpired("2030-01-01", new Date("2025-01-01"))).toBe(
      false,
    );
  });
});
