import { describe, expect, it } from "vitest";
import { canCreateCharacter, maxCharactersForTier } from "./character-limit.js";

describe("character limits", () => {
  it("premium allows many characters", () => {
    expect(maxCharactersForTier("premium")).toBeGreaterThan(100);
  });

  it("blocks free tier at limit", () => {
    const r = canCreateCharacter("free", 3);
    expect(r.ok).toBe(false);
  });
});
