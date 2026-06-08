import { describe, expect, it } from "vitest";
import { normalizeMomentVisibility } from "./moment-visibility.js";

describe("normalizeMomentVisibility", () => {
  it("defaults unknown values to private", () => {
    expect(normalizeMomentVisibility(undefined)).toBe("private");
    expect(normalizeMomentVisibility("unknown")).toBe("private");
  });

  it("accepts public and friends", () => {
    expect(normalizeMomentVisibility("public")).toBe("public");
    expect(normalizeMomentVisibility("friends")).toBe("friends");
  });
});
