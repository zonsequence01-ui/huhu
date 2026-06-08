import { eq } from "drizzle-orm";
import type { Db } from "../db/index.js";
import { users } from "../db/schema-bindings.js";

export const MIN_COMPANION_AGE = 18;

export function isAgeGateEnabled(): boolean {
  return process.env.AGE_GATE !== "0";
}

export function isAgeConfirmed(
  user: { ageConfirmedAt: string | null },
): boolean {
  if (!isAgeGateEnabled()) return true;
  return Boolean(user.ageConfirmedAt);
}

export function validateBirthYear(birthYear: number): boolean {
  const year = new Date().getFullYear();
  if (!Number.isInteger(birthYear) || birthYear < 1900 || birthYear > year) {
    return false;
  }
  return year - birthYear >= MIN_COMPANION_AGE;
}

export async function confirmUserAge(
  db: Db,
  userId: string,
  birthYear: number,
): Promise<
  | { ok: true; ageConfirmedAt: string }
  | { ok: false; reason: string }
> {
  if (!validateBirthYear(birthYear)) {
    return { ok: false, reason: "must_be_18_or_older" };
  }
  const now = new Date().toISOString();
  await db
    .update(users)
    .set({ ageConfirmedAt: now })
    .where(eq(users.id, userId));
  return { ok: true, ageConfirmedAt: now };
}
