import { SUBSCRIPTION_PERIOD_DAYS } from "./constants.js";

export function extendSubscriptionExpiry(
  currentExpiresAt: string | null | undefined,
  from = new Date(),
): string {
  const now = from.getTime();
  const baseMs =
    currentExpiresAt && new Date(currentExpiresAt).getTime() > now
      ? new Date(currentExpiresAt).getTime()
      : now;
  return new Date(
    baseMs + SUBSCRIPTION_PERIOD_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();
}

export function isSubscriptionExpired(
  expiresAt: string | null | undefined,
  now = new Date(),
): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() <= now.getTime();
}
