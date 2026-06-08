import { describe, expect, it } from "vitest";
import {
  API_ERROR_CODES,
  buildApiErrorsMeta,
  formatApiErrorMessage,
  isKnownApiErrorCode,
} from "./api-errors.js";

describe("formatApiErrorMessage", () => {
  it("localizes voice subscription error for zh-TW", () => {
    const msg = formatApiErrorMessage(
      "zh-TW",
      "voice_requires_basic_subscription",
    );
    expect(msg).toMatch(/基礎/);
    expect(msg).not.toBe("voice_requires_basic_subscription");
  });

  it("localizes insufficient stamina for en", () => {
    expect(formatApiErrorMessage("en", "insufficient_stamina")).toMatch(
      /stamina/i,
    );
  });

  it("returns raw code for unknown errors", () => {
    expect(formatApiErrorMessage("en", "unknown_xyz")).toBe("unknown_xyz");
  });

  it("tracks known codes", () => {
    expect(isKnownApiErrorCode("insufficient_coins")).toBe(true);
    expect(isKnownApiErrorCode("nope")).toBe(false);
  });

  it("buildApiErrorsMeta returns all codes localized", () => {
    const meta = buildApiErrorsMeta("zh-TW");
    expect(Object.keys(meta).sort()).toEqual([...API_ERROR_CODES].sort());
    expect(meta.voice_requires_basic_subscription).toMatch(/基礎/);
    expect(meta.content_required).toMatch(/內容/);
  });

  it("normalizes BCP-47 tags like en-US for apiErrors", () => {
    const meta = buildApiErrorsMeta("en-US");
    expect(meta.insufficient_stamina).toMatch(/stamina/i);
    expect(meta.content_required).toMatch(/required/i);
  });

  it("includes validation_failed in apiErrors meta", () => {
    const meta = buildApiErrorsMeta("zh-TW");
    expect(meta.validation_failed).toMatch(/格式|檢查/);
  });

  it("localizes ja-JP apiErrors without English fallbacks", () => {
    const meta = buildApiErrorsMeta("ja-JP");
    expect(meta.insufficient_coins).toMatch(/コイン/);
    expect(meta.insufficient_coins).not.toMatch(/Not enough/i);
    expect(meta.content_required).toMatch(/メッセージ|入力/);
    expect(meta.voice_requires_basic_subscription).toMatch(/ベーシック/);
  });

  it("localizes character_not_found for zh-TW", () => {
    expect(formatApiErrorMessage("zh-TW", "character_not_found")).toMatch(
      /角色/,
    );
    expect(formatApiErrorMessage("zh-TW", "character_not_found")).not.toBe(
      "character_not_found",
    );
  });

  it("localizes ko-KR apiErrors without English fallbacks", () => {
    const meta = buildApiErrorsMeta("ko-KR");
    expect(meta.insufficient_coins).toMatch(/코인/);
    expect(meta.insufficient_coins).not.toMatch(/Not enough/i);
    expect(meta.content_required).toMatch(/메시지|입력/);
  });
});
