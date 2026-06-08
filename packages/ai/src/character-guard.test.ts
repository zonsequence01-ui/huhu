import { describe, expect, it } from "vitest";
import { guardCharacterReply } from "./character-guard.js";

describe("guardCharacterReply", () => {
  it("replaces AI meta disclosure", () => {
    const r = guardCharacterReply("我是人工智慧語言模型，無法…", "小呼");
    expect(r.corrected).toBe(true);
    expect(r.content).toContain("小呼");
  });

  it("passes normal in-character text", () => {
    const r = guardCharacterReply("今天辛苦了，抱抱你。", "小呼");
    expect(r.corrected).toBe(false);
    expect(r.content).toContain("抱抱");
  });

  it("uses locale-aware fallback for Japanese meta replies", () => {
    const r = guardCharacterReply(
      "私はAIアシスタントです",
      "桜",
      "ja-JP",
    );
    expect(r.corrected).toBe(true);
    expect(r.content).toContain("桜");
    expect(r.content).toContain("もう一度");
  });

  it("uses locale-aware empty fallback in English", () => {
    const r = guardCharacterReply("   ", "Mira", "en-US");
    expect(r.corrected).toBe(true);
    expect(r.content).toContain("Mira");
    expect(r.content.toLowerCase()).toContain("again");
  });
});
