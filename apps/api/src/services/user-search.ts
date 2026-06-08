import { and, eq, ne, sql } from "drizzle-orm";
import type { SqliteDb } from "../db/sqlite-db.js";
import { users } from "../db/schema-bindings.js";
import { normalizeInviteCode } from "./invite-code.js";
import { filterOutBlockedUserIds } from "./user-block.js";

export type UserSearchHit = {
  userId: string;
  displayName: string;
  inviteCode: string | null;
  matchType: "invite_code" | "display_name";
};

const MIN_QUERY_LEN = 2;
const MAX_RESULTS = 10;

export async function searchUsers(
  db: SqliteDb,
  viewerUserId: string,
  rawQuery: string,
): Promise<UserSearchHit[]> {
  const q = rawQuery.trim();
  if (q.length < MIN_QUERY_LEN) return [];

  const inviteNorm = normalizeInviteCode(q);
  const byId = new Map<string, UserSearchHit>();

  if (inviteNorm.length >= 4) {
    const exact = await db
      .select({
        id: users.id,
        displayName: users.displayName,
        inviteCode: users.inviteCode,
      })
      .from(users)
      .where(eq(users.inviteCode, inviteNorm))
      .limit(1);
    for (const r of exact) {
      if (r.id === viewerUserId) continue;
      byId.set(r.id, {
        userId: r.id,
        displayName: r.displayName,
        inviteCode: r.inviteCode,
        matchType: "invite_code",
      });
    }

    if (inviteNorm.length < 8) {
      const prefix = await db
        .select({
          id: users.id,
          displayName: users.displayName,
          inviteCode: users.inviteCode,
        })
        .from(users)
        .where(
          and(
            ne(users.id, viewerUserId),
            sql`${users.inviteCode} like ${`${inviteNorm}%`}`,
          ),
        )
        .limit(MAX_RESULTS);
      for (const r of prefix) {
        if (byId.has(r.id)) continue;
        byId.set(r.id, {
          userId: r.id,
          displayName: r.displayName,
          inviteCode: r.inviteCode,
          matchType: "invite_code",
        });
      }
    }
  }

  const namePattern = `%${q.toLowerCase()}%`;
  const nameRows = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      inviteCode: users.inviteCode,
    })
    .from(users)
    .where(
      and(
        ne(users.id, viewerUserId),
        sql`lower(${users.displayName}) like ${namePattern}`,
      ),
    )
    .limit(MAX_RESULTS * 2);

  for (const r of nameRows) {
    if (byId.has(r.id)) continue;
    byId.set(r.id, {
      userId: r.id,
      displayName: r.displayName,
      inviteCode: r.inviteCode,
      matchType: "display_name",
    });
  }

  const ids = [...byId.keys()];
  const allowed = new Set(
    await filterOutBlockedUserIds(db, viewerUserId, ids),
  );
  return [...byId.values()]
    .filter((h) => allowed.has(h.userId))
    .slice(0, MAX_RESULTS);
}
