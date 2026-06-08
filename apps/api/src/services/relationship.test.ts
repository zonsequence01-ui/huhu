import { describe, expect, it } from "vitest";
import {
  affectionDeltaFromMessage,
  stageFromAffection,
  clampAffection,
} from "./relationship.js";

describe("relationship progression", () => {
  it("advances stage with affection", () => {
    expect(stageFromAffection(0)).toBe("stranger");
    expect(stageFromAffection(150)).toBe("acquaintance");
    expect(stageFromAffection(500)).toBe("dating");
  });

  it("positive messages increase affection", () => {
    const delta = affectionDeltaFromMessage("我好喜歡你", "exciting");
    expect(delta).toBeGreaterThan(1);
    expect(clampAffection(999 + delta)).toBeLessThanOrEqual(1000);
  });
});
