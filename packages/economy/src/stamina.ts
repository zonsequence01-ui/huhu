import {
  STAMINA_MAX,
  STAMINA_RECOVER_INTERVAL_MS,
  type SubscriptionTier,
} from "@huhu/shared";

export interface StaminaState {
  current: number;
  updatedAt: Date;
}

export function applyStaminaRecovery(
  state: StaminaState,
  now: Date = new Date(),
): StaminaState {
  const elapsed = now.getTime() - state.updatedAt.getTime();
  if (elapsed < STAMINA_RECOVER_INTERVAL_MS) {
    return state;
  }
  const points = Math.floor(elapsed / STAMINA_RECOVER_INTERVAL_MS);
  const recovered = Math.min(STAMINA_MAX, state.current + points);
  const intervalsUsed = points * STAMINA_RECOVER_INTERVAL_MS;
  return {
    current: recovered,
    updatedAt: new Date(state.updatedAt.getTime() + intervalsUsed),
  };
}

export function hasUnlimitedStamina(tier: SubscriptionTier): boolean {
  return tier === "lite" || tier === "basic" || tier === "premium";
}

export function canSpendStamina(
  state: StaminaState,
  cost: number,
  tier: SubscriptionTier,
  now: Date = new Date(),
): { ok: boolean; state: StaminaState; reason?: string } {
  if (hasUnlimitedStamina(tier)) {
    return { ok: true, state };
  }
  const recovered = applyStaminaRecovery(state, now);
  if (recovered.current < cost) {
    return {
      ok: false,
      state: recovered,
      reason: "insufficient_stamina",
    };
  }
  return {
    ok: true,
    state: {
      current: recovered.current - cost,
      updatedAt: now,
    },
  };
}
