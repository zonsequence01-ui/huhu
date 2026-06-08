import { describe, it, expect } from "vitest";
import { scrubPii } from "./pii.js";

describe("scrubPii", () => {
  it("masks email addresses", () => {
    expect(scrubPii("聯絡我 test@example.com 謝謝")).toBe(
      "聯絡我 [EMAIL] 謝謝",
    );
  });

  it("masks phone numbers", () => {
    expect(scrubPii("我的電話是 0912-345-678")).toMatch(/\[PHONE\]/);
  });

  it("masks Chinese addresses", () => {
    expect(scrubPii("我住在台北市信義路五段7號")).toMatch(/\[ADDRESS\]/);
  });

  it("leaves non-PII text unchanged", () => {
    const text = "今天天氣很好，想去海邊散步";
    expect(scrubPii(text)).toBe(text);
  });
});
