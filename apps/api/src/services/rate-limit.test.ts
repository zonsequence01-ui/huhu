import { describe, expect, it, beforeEach } from "vitest";
import { checkRateLimit, resetRateLimitsForTests } from "./rate-limit.js";

describe("rate-limit", () => {
  beforeEach(() => resetRateLimitsForTests());

  it("allows up to max within window", async () => {
    await expect(checkRateLimit("k", 2, 60_000, 0)).resolves.toBe(true);
    await expect(checkRateLimit("k", 2, 60_000, 0)).resolves.toBe(true);
    await expect(checkRateLimit("k", 2, 60_000, 0)).resolves.toBe(false);
  });

  it("resets after window", async () => {
    await expect(checkRateLimit("k", 1, 100, 0)).resolves.toBe(true);
    await expect(checkRateLimit("k", 1, 100, 0)).resolves.toBe(false);
    await expect(checkRateLimit("k", 1, 100, 101)).resolves.toBe(true);
  });
});
