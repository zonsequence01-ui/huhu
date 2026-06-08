import { eq } from "drizzle-orm";
import type { SqliteDb } from "../db/sqlite-db.js";
import { users } from "../db/schema-bindings.js";

const MIN_LEN = 2;
const MAX_LEN = 32;

export function normalizeDisplayName(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

export function validateDisplayName(raw: string): string | null {
  const name = normalizeDisplayName(raw);
  if (name.length < MIN_LEN || name.length > MAX_LEN) return null;
  return name;
}

export async function updateUserDisplayName(
  db: SqliteDb,
  userId: string,
  raw: string,
): Promise<
  | { ok: true; displayName: string }
  | { ok: false; error: "invalid_display_name" | "user_not_found" }
> {
  const displayName = validateDisplayName(raw);
  if (!displayName) return { ok: false, error: "invalid_display_name" };
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!rows[0]) return { ok: false, error: "user_not_found" };
  await db
    .update(users)
    .set({ displayName })
    .where(eq(users.id, userId));
  return { ok: true, displayName };
}
