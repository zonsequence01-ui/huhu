import { describe, expect, it } from "vitest";
import { affectionPercent, stageLabelForLocale } from "./relationship.js";

describe("affectionPercent", () => {
  it("returns 0 for zero affection", () => {
    expect(affectionPercent(0)).toBe(0);
  });

  it("returns at least 1% when affection is positive", () => {
    expect(affectionPercent(1)).toBe(1);
  });
});

describe("stageLabelForLocale", () => {
  it("returns locale-appropriate stage names", () => {
    expect(stageLabelForLocale("stranger", "zh-TW")).toBe("陌生人");
    expect(stageLabelForLocale("stranger", "en-US")).toBe("Stranger");
    expect(stageLabelForLocale("dating", "ja-JP")).toBe("付き合い中");
    expect(stageLabelForLocale("partner", "ko-KR")).toBe("연인");
    expect(stageLabelForLocale("married", "vi-VN")).toBe("Tri kỷ");
    expect(stageLabelForLocale("ambiguous", "zh-CN")).toBe("暧昧");
  });
});
