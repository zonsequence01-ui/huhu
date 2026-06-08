import {
  COIN_COST_EXCITING_MODE,
  COIN_COST_LONG_MODE,
  type ChatMode,
} from "@huhu/shared";

export function coinCostForMode(mode: ChatMode): number {
  switch (mode) {
    case "simple":
      return 0;
    case "long":
      return COIN_COST_LONG_MODE;
    case "exciting":
      return COIN_COST_EXCITING_MODE;
    default:
      return 0;
  }
}

export function canSpendCoins(
  balance: number,
  mode: ChatMode,
): { ok: boolean; cost: number; reason?: string } {
  const cost = coinCostForMode(mode);
  if (cost === 0) return { ok: true, cost: 0 };
  if (balance < cost) {
    return { ok: false, cost, reason: "insufficient_coins" };
  }
  return { ok: true, cost };
}
