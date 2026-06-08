import { describe, expect, it } from "vitest";
import { validateDisplayName } from "./display-name.js";

describe("display-name", () => {
  it("accepts trimmed names within bounds", () => {
    expect(validateDisplayName("  小呼  ")).toBe("小呼");
  });

  it("rejects too short names", () => {
    expect(validateDisplayName("a")).toBeNull();
  });
});
