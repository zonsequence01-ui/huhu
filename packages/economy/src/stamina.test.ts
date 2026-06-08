import { describe, expect, it } from "vitest";
import {
  STAMINA_MAX,
  STAMINA_RECOVER_INTERVAL_MS,
} from "@huhu/shared";
import { applyStaminaRecovery, canSpendStamina } from "./stamina.js";

describe("stamina recovery", () => {
  it("recovers 1 point per 10 minutes up to max", () => {
    const base = new Date("2025-01-01T00:00:00Z");
    const state = { current: 0, updatedAt: base };
    const after = applyStaminaRecovery(
      state,
      new Date(base.getTime() + STAMINA_RECOVER_INTERVAL_MS * 25),
    );
    expect(after.current).toBe(25);
  });

  it("caps at STAMINA_MAX", () => {
    const base = new Date("2025-01-01T00:00:00Z");
    const state = { current: 48, updatedAt: base };
    const after = applyStaminaRecovery(
      state,
      new Date(base.getTime() + STAMINA_RECOVER_INTERVAL_MS * 10),
    );
    expect(after.current).toBe(STAMINA_MAX);
  });
});

describe("canSpendStamina", () => {
  it("lite tier bypasses stamina", () => {
    const result = canSpendStamina(
      { current: 0, updatedAt: new Date() },
      1,
      "lite",
    );
    expect(result.ok).toBe(true);
  });

  it("free tier rejects when insufficient", () => {
    const result = canSpendStamina(
      { current: 0, updatedAt: new Date() },
      1,
      "free",
    );
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("insufficient_stamina");
  });
});
