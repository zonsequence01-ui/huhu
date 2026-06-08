import { eq } from "drizzle-orm";
import { canCreateCharacter } from "@huhu/economy";
import type { SubscriptionTier } from "@huhu/shared";
import type { Db } from "../db/index.js";
import { characters } from "../db/schema-bindings.js";

export async function assertCanCreateCharacter(
  db: Db,
  userId: string,
  subscriptionTier: string,
): Promise<{ ok: true } | { ok: false; limit: number }> {
  const rows = await db
    .select({ id: characters.id })
    .from(characters)
    .where(eq(characters.userId, userId));
  const check = canCreateCharacter(
    subscriptionTier as SubscriptionTier,
    rows.length,
  );
  if (!check.ok) {
    return { ok: false, limit: check.limit };
  }
  return { ok: true };
}
