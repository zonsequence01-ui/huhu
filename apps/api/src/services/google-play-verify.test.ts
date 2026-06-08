import { describe, expect, it } from "vitest";
import { parseGooglePlayReceipt } from "./google-play-verify.js";

describe("google-play-verify", () => {
  it("parses gp receipt tokens", () => {
    expect(parseGooglePlayReceipt("gp:abc-token")).toEqual({
      purchaseToken: "abc-token",
    });
    expect(
      parseGooglePlayReceipt("gp:com.ctrlz.huhu.coins.small:long-token"),
    ).toEqual({ purchaseToken: "long-token" });
    expect(parseGooglePlayReceipt("invalid")).toBeNull();
  });
});
