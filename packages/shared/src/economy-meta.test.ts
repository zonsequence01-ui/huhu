import { describe, expect, it } from "vitest";
import { getEconomyMeta } from "./economy-meta.js";

describe("economy-meta", () => {
  it("exports stamina and coin costs", () => {
    const m = getEconomyMeta();
    expect(m.stamina.max).toBe(50);
    expect(m.coins.longMode).toBe(5);
    expect(m.chatModes).toContain("simple");
  });
});
