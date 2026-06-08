import { describe, expect, it } from "vitest";
import { normalizeClientLocale } from "./locales.js";

describe("normalizeClientLocale", () => {
  it("maps BCP-47 tags to supported ids", () => {
    expect(normalizeClientLocale("en-US")).toBe("en");
    expect(normalizeClientLocale("ja-JP")).toBe("ja-JP");
    expect(normalizeClientLocale("vi-VN")).toBe("vi-VN");
    expect(normalizeClientLocale("unknown")).toBe("zh-TW");
  });
});
