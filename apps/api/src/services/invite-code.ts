import { randomBytes } from "node:crypto";
import { eq, isNull } from "drizzle-orm";
import type { SqliteDb } from "../db/sqlite-db.js";
import { users } from "../db/schema-bindings.js";

/** Excludes ambiguous 0/O, 1/I/L. */
const INVITE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const INVITE_CODE_LENGTH = 8;

export function normalizeInviteCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function generateInviteCode(): string {
  let code = "";
  for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
    const idx = randomBytes(1)[0]! % INVITE_ALPHABET.length;
    code += INVITE_ALPHABET[idx];
  }
  return code;
}

export async function findUserIdByInviteCode(
  db: SqliteDb,
  rawCode: string,
): Promise<string | null> {
  const code = normalizeInviteCode(rawCode);
  if (code.length < 4) return null;
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.inviteCode, code))
    .limit(1);
  return rows[0]?.id ?? null;
}

export async function ensureUserInviteCode(
  db: SqliteDb,
  userId: string,
): Promise<string> {
  const rows = await db
    .select({ inviteCode: users.inviteCode })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const existing = rows[0]?.inviteCode;
  if (existing) return existing;

  for (let attempt = 0; attempt < 12; attempt++) {
    const code = generateInviteCode();
    const taken = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.inviteCode, code))
      .limit(1);
    if (taken[0]) continue;
    await db
      .update(users)
      .set({ inviteCode: code })
      .where(eq(users.id, userId));
    return code;
  }
  throw new Error("invite_code_generation_failed");
}

/** Backfill users created before invite codes (tests / migrations). */
export async function backfillMissingInviteCodes(db: SqliteDb): Promise<void> {
  const missing = await db
    .select({ id: users.id })
    .from(users)
    .where(isNull(users.inviteCode));
  for (const row of missing) {
    await ensureUserInviteCode(db, row.id);
  }
}
