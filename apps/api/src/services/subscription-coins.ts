import { eq } from "drizzle-orm";
import {
  SUBSCRIPTION_MONTHLY_COINS,
  isSubscriptionExpired,
  type SubscriptionTier,
} from "@huhu/shared";
import type { Db } from "../db/index.js";
import { users } from "../db/schema-bindings.js";

function currentGrantMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export function monthlyCoinsForTier(tier: SubscriptionTier): number {
  if (tier === "free") return 0;
  return SUBSCRIPTION_MONTHLY_COINS[tier];
}

type UserRow = typeof users.$inferSelect;

/** Grant calendar-month subscription coins once per active paid tier. */
export async function grantMonthlySubscriptionCoins(
  db: Db,
  user: UserRow,
): Promise<UserRow> {
  const tier = user.subscriptionTier as SubscriptionTier;
  if (tier === "free") return user;
  if (isSubscriptionExpired(user.subscriptionExpiresAt)) return user;

  const month = currentGrantMonth();
  if (user.subscriptionCoinsGrantMonth === month) return user;

  const award = monthlyCoinsForTier(tier);
  if (award <= 0) return user;

  const newCoins = user.coins + award;
  await db
    .update(users)
    .set({
      coins: newCoins,
      subscriptionCoinsGrantMonth: month,
    })
    .where(eq(users.id, user.id));

  return {
    ...user,
    coins: newCoins,
    subscriptionCoinsGrantMonth: month,
  };
}
