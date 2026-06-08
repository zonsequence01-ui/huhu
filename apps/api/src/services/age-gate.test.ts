import { describe, it, expect } from "vitest";
import { validateBirthYear } from "./age-gate.js";

describe("age-gate", () => {
  it("requires at least 18 years old", () => {
    const year = new Date().getFullYear();
    expect(validateBirthYear(year - 17)).toBe(false);
    expect(validateBirthYear(year - 18)).toBe(true);
    expect(validateBirthYear(year - 30)).toBe(true);
  });
});
