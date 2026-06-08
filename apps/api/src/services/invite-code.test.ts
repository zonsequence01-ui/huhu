import { describe, expect, it } from "vitest";
import {
  INVITE_CODE_LENGTH,
  generateInviteCode,
  normalizeInviteCode,
} from "./invite-code.js";

describe("invite-code", () => {
  it("normalizes to uppercase alphanumeric", () => {
    expect(normalizeInviteCode(" ab-cd12 ")).toBe("ABCD12");
  });

  it("generates fixed-length codes from safe alphabet", () => {
    const code = generateInviteCode();
    expect(code).toHaveLength(INVITE_CODE_LENGTH);
    expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/);
  });
});
