import { describe, expect, it } from "vitest";
import { localeHint } from "./locale.js";

describe("localeHint", () => {
  it("maps locale prefixes to cultural hints", () => {
    expect(localeHint("en-US")).toContain("English");
    expect(localeHint("ja-JP")).toContain("日語");
    expect(localeHint("zh-CN")).toContain("簡體");
    expect(localeHint("vi-VN")).toContain("Việt");
  });
});
