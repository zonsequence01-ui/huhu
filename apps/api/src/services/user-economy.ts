import { eq } from "drizzle-orm";
import {
  DAILY_CHECKIN_COINS,
  OFFERWALL_COINS_MAX,
  OFFERWALL_COINS_MIN,
  OFFERWALL_DAILY_CAP,
  STAMINA_MAX,
} from "@huhu/shared";
import { applyStaminaRecovery } from "@huhu/economy";
import type { Db } from "../db/index.js";
import { users } from "../db/schema-bindings.js";
import { ensureActiveSubscription } from "./subscription.js";
import { grantMonthlySubscriptionCoins } from "./subscription-coins.js";

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function syncUserStamina(db: Db, userId: string) {
  const row = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  let user = row[0];
  if (!user) return null;

  user = await ensureActiveSubscription(db, user);
  user = await grantMonthlySubscriptionCoins(db, user);

  const recovered = applyStaminaRecovery({
    current: user.stamina,
    updatedAt: new Date(user.staminaUpdatedAt),
  });

  if (
    recovered.current !== user.stamina ||
    recovered.updatedAt.toISOString() !== user.staminaUpdatedAt
  ) {
    await db
      .update(users)
      .set({
        stamina: recovered.current,
        staminaUpdatedAt: recovered.updatedAt.toISOString(),
      })
      .where(eq(users.id, userId));
    return {
      ...user,
      stamina: recovered.current,
      staminaUpdatedAt: recovered.updatedAt.toISOString(),
    };
  }
  return user;
}

export async function claimOfferwallReward(
  db: Db,
  userId: string,
): Promise<
  | { ok: true; coinsAwarded: number; coins: number; claimsRemaining: number }
  | { ok: false; reason: string }
> {
  const user = await syncUserStamina(db, userId);
  if (!user) return { ok: false, reason: "user_not_found" };

  const today = todayKey();
  let count =
    user.offerwallClaimsDate === today ? user.offerwallClaimsCount : 0;

  if (count >= OFFERWALL_DAILY_CAP) {
    return { ok: false, reason: "offerwall_daily_cap" };
  }

  const coinsAwarded =
    OFFERWALL_COINS_MIN +
    Math.floor(
      Math.random() * (OFFERWALL_COINS_MAX - OFFERWALL_COINS_MIN + 1),
    );
  count += 1;
  const newCoins = user.coins + coinsAwarded;

  await db
    .update(users)
    .set({
      coins: newCoins,
      offerwallClaimsDate: today,
      offerwallClaimsCount: count,
    })
    .where(eq(users.id, userId));

  return {
    ok: true,
    coinsAwarded,
    coins: newCoins,
    claimsRemaining: OFFERWALL_DAILY_CAP - count,
  };
}

export async function claimDailyCheckin(
  db: Db,
  userId: string,
): Promise<
  | { ok: true; coinsAwarded: number; coins: number }
  | { ok: false; reason: string }
> {
  const user = await syncUserStamina(db, userId);
  if (!user) return { ok: false, reason: "user_not_found" };

  const today = todayKey();
  if (user.dailyCheckinDate === today) {
    return { ok: false, reason: "daily_checkin_already_claimed" };
  }

  const newCoins = user.coins + DAILY_CHECKIN_COINS;
  await db
    .update(users)
    .set({ coins: newCoins, dailyCheckinDate: today })
    .where(eq(users.id, userId));

  return { ok: true, coinsAwarded: DAILY_CHECKIN_COINS, coins: newCoins };
}

export function formatStaminaDisplay(
  stamina: number,
  tier: string,
): { current: number; max: number; unlimited: boolean } {
  const unlimited = tier === "lite" || tier === "basic" || tier === "premium";
  return {
    current: unlimited ? STAMINA_MAX : stamina,
    max: STAMINA_MAX,
    unlimited,
  };
}
