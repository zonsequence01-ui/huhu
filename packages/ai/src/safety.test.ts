import { describe, expect, it } from "vitest";
import { checkMessageSafety } from "./safety.js";

describe("checkMessageSafety", () => {
  it("flags crisis", () => {
    const r = checkMessageSafety("我不想活了");
    expect(r.category).toBe("crisis");
  });

  it("flags wellness", () => {
    const r = checkMessageSafety("最近好抑鬱，不想面對現實");
    expect(r.category).toBe("wellness");
  });

  it("returns locale-aware crisis message for Japanese", () => {
    const r = checkMessageSafety("死にたい", "ja-JP");
    expect(r.category).toBe("crisis");
    expect(r.resourceMessage).toContain("いのちの電話");
  });

  it("returns locale-aware crisis message for Vietnamese", () => {
    const r = checkMessageSafety("tôi muốn chết", "vi-VN");
    expect(r.category).toBe("crisis");
    expect(r.resourceMessage).toContain("096 306 1414");
  });
});
