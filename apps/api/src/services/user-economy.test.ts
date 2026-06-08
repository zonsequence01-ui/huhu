import { describe, expect, it } from "vitest";
import { OFFERWALL_DAILY_CAP } from "@huhu/shared";

describe("offerwall cap constant", () => {
  it("allows reasonable daily claims", () => {
    expect(OFFERWALL_DAILY_CAP).toBeGreaterThanOrEqual(5);
  });
});
