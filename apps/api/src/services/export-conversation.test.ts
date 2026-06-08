import { describe, expect, it } from "vitest";
import { formatWebNovelExport } from "./export-conversation.js";

describe("formatWebNovelExport", () => {
  it("formats markdown novel", () => {
    const md = formatWebNovelExport(
      { name: "小呼" },
      [
        { role: "user", content: "嗨", createdAt: "2020-01-01" },
        { role: "assistant", content: "你好呀", createdAt: "2020-01-02" },
      ],
      "stranger",
    );
    expect(md).toContain("# 小呼");
    expect(md).toContain("**你**：嗨");
    expect(md).toContain("**小呼**：你好呀");
  });

  it("tags safety resource replies", () => {
    const md = formatWebNovelExport(
      { name: "小呼" },
      [
        {
          role: "assistant",
          content: "請撥打 1925",
          createdAt: "2020-01-02",
          safetyCategory: "crisis",
        },
      ],
      "stranger",
    );
    expect(md).toContain("**小呼** *(支援資源)*：");
  });

  it("tags character-corrected replies", () => {
    const md = formatWebNovelExport(
      { name: "小呼" },
      [
        {
          role: "assistant",
          content: "（小呼輕輕握住你的手）",
          createdAt: "2020-01-02",
          characterCorrected: true,
        },
      ],
      "stranger",
    );
    expect(md).toContain("**小呼** *(角色修正)*：");
  });

  it("uses locale-aware stage label in header", () => {
    const md = formatWebNovelExport(
      { name: "Mia", locale: "en-US" },
      [],
      "dating",
    );
    expect(md).toContain("Dating");
    expect(md).not.toContain("交往");
  });

  it("scrubs PII from user messages in export", () => {
    const md = formatWebNovelExport(
      { name: "小呼" },
      [
        {
          role: "user",
          content: "寄到 secret@test.com 或打 0912345678",
          createdAt: "2020-01-01",
        },
      ],
      "stranger",
    );
    expect(md).toContain("[EMAIL]");
    expect(md).toContain("[PHONE]");
    expect(md).not.toContain("secret@test.com");
  });
});
