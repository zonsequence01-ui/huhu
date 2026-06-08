import { and, eq, or } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { SqliteDb } from "../db/sqlite-db.js";
import {
  userBlocks,
  userFriendships,
  users,
} from "../db/schema-bindings.js";

export async function hasBlockBetween(
  db: SqliteDb,
  userA: string,
  userB: string,
): Promise<boolean> {
  const rows = await db
    .select({ id: userBlocks.id })
    .from(userBlocks)
    .where(
      or(
        and(
          eq(userBlocks.blockerUserId, userA),
          eq(userBlocks.blockedUserId, userB),
        ),
        and(
          eq(userBlocks.blockerUserId, userB),
          eq(userBlocks.blockedUserId, userA),
        ),
      ),
    )
    .limit(1);
  return rows.length > 0;
}

export async function listBlockedUserIds(
  db: SqliteDb,
  blockerUserId: string,
): Promise<string[]> {
  const rows = await db
    .select({ blockedUserId: userBlocks.blockedUserId })
    .from(userBlocks)
    .where(eq(userBlocks.blockerUserId, blockerUserId));
  return rows.map((r) => r.blockedUserId);
}

export async function filterOutBlockedUserIds(
  db: SqliteDb,
  viewerUserId: string,
  candidateIds: string[],
): Promise<string[]> {
  if (candidateIds.length === 0) return [];
  const blockedByViewer = new Set(await listBlockedUserIds(db, viewerUserId));
  const blockedViewer = await db
    .select({ blockerUserId: userBlocks.blockerUserId })
    .from(userBlocks)
    .where(eq(userBlocks.blockedUserId, viewerUserId));
  const blockedViewerSet = new Set(
    blockedViewer.map((r) => r.blockerUserId),
  );
  return candidateIds.filter(
    (id) => !blockedByViewer.has(id) && !blockedViewerSet.has(id),
  );
}

async function removeFriendshipsBetween(
  db: SqliteDb,
  userA: string,
  userB: string,
): Promise<void> {
  await db
    .delete(userFriendships)
    .where(
      or(
        and(
          eq(userFriendships.requesterUserId, userA),
          eq(userFriendships.addresseeUserId, userB),
        ),
        and(
          eq(userFriendships.requesterUserId, userB),
          eq(userFriendships.addresseeUserId, userA),
        ),
      ),
    );
}

export async function blockUser(
  db: SqliteDb,
  blockerUserId: string,
  blockedUserId: string,
): Promise<
  | { ok: true }
  | { ok: false; error: "cannot_block_self" | "user_not_found" | "already_blocked" }
> {
  if (blockerUserId === blockedUserId) {
    return { ok: false, error: "cannot_block_self" };
  }
  const target = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, blockedUserId))
    .limit(1);
  if (!target[0]) return { ok: false, error: "user_not_found" };

  const existing = await db
    .select({ id: userBlocks.id })
    .from(userBlocks)
    .where(
      and(
        eq(userBlocks.blockerUserId, blockerUserId),
        eq(userBlocks.blockedUserId, blockedUserId),
      ),
    )
    .limit(1);
  if (existing[0]) return { ok: false, error: "already_blocked" };

  await db.insert(userBlocks).values({
    id: nanoid(),
    blockerUserId,
    blockedUserId,
    createdAt: new Date().toISOString(),
  });
  await removeFriendshipsBetween(db, blockerUserId, blockedUserId);
  return { ok: true };
}

export async function unblockUser(
  db: SqliteDb,
  blockerUserId: string,
  blockedUserId: string,
): Promise<
  | { ok: true }
  | { ok: false; error: "not_blocked" }
> {
  const existing = await db
    .select({ id: userBlocks.id })
    .from(userBlocks)
    .where(
      and(
        eq(userBlocks.blockerUserId, blockerUserId),
        eq(userBlocks.blockedUserId, blockedUserId),
      ),
    )
    .limit(1);
  if (!existing[0]) return { ok: false, error: "not_blocked" };
  await db
    .delete(userBlocks)
    .where(
      and(
        eq(userBlocks.blockerUserId, blockerUserId),
        eq(userBlocks.blockedUserId, blockedUserId),
      ),
    );
  return { ok: true };
}

export async function listBlockedUsers(
  db: SqliteDb,
  blockerUserId: string,
): Promise<{ userId: string; displayName: string; createdAt: string }[]> {
  const rows = await db
    .select()
    .from(userBlocks)
    .where(eq(userBlocks.blockerUserId, blockerUserId));
  const out: { userId: string; displayName: string; createdAt: string }[] = [];
  for (const r of rows) {
    const u = await db
      .select({ displayName: users.displayName })
      .from(users)
      .where(eq(users.id, r.blockedUserId))
      .limit(1);
    out.push({
      userId: r.blockedUserId,
      displayName: u[0]?.displayName ?? r.blockedUserId,
      createdAt: r.createdAt,
    });
  }
  return out;
}
