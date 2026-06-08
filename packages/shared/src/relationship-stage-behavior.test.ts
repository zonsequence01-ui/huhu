import { describe, expect, it } from "vitest";
import { relationshipStageBehavior } from "./relationship-stage-behavior.js";

describe("relationshipStageBehavior", () => {
  it("returns locale-appropriate stage tone", () => {
    expect(relationshipStageBehavior("stranger", "zh-TW")).toContain("禮貌");
    expect(relationshipStageBehavior("dating", "en-US")).toMatch(/jealousy|flirt/i);
    expect(relationshipStageBehavior("partner", "ja-JP")).toContain("信頼");
    expect(relationshipStageBehavior("married", "ko-KR")).toContain("연인");
    expect(relationshipStageBehavior("ambiguous", "vi-VN")).toContain("mơ hồ");
  });
});
