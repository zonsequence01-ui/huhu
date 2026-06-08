import { eq } from "drizzle-orm";
import {
  extendSubscriptionExpiry,
  isSubscriptionExpired,
  type SubscriptionTier,
} from "@huhu/shared";
import type { Db } from "../db/index.js";
import { users } from "../db/schema-bindings.js";

type UserRow = typeof users.$inferSelect;

/** Downgrade expired paid tiers; backfill expiry for legacy paid rows without date. */
export async function ensureActiveSubscription(
  db: Db,
  user: UserRow,
): Promise<UserRow> {
  const tier = user.subscriptionTier as SubscriptionTier;
  if (tier === "free") return user;

  if (!user.subscriptionExpiresAt) {
    const expiresAt = extendSubscriptionExpiry(null);
    await db
      .update(users)
      .set({ subscriptionExpiresAt: expiresAt })
      .where(eq(users.id, user.id));
    return { ...user, subscriptionExpiresAt: expiresAt };
  }

  if (!isSubscriptionExpired(user.subscriptionExpiresAt)) return user;

  await db
    .update(users)
    .set({ subscriptionTier: "free", subscriptionExpiresAt: null })
    .where(eq(users.id, user.id));

  return {
    ...user,
    subscriptionTier: "free",
    subscriptionExpiresAt: null,
  };
}

export function nextSubscriptionExpiry(
  currentExpiresAt: string | null | undefined,
): string {
  return extendSubscriptionExpiry(currentExpiresAt);
}
