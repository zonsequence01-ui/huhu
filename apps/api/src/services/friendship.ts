import { and, eq, or } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { SqliteDb } from "../db/sqlite-db.js";
import { userFriendships, users } from "../db/schema-bindings.js";
import {
  filterOutBlockedUserIds,
  hasBlockBetween,
} from "./user-block.js";

export type FriendshipStatus = "pending" | "accepted";

export type FriendshipRow = {
  id: string;
  requesterUserId: string;
  addresseeUserId: string;
  status: FriendshipStatus;
  createdAt: string;
  updatedAt: string;
};

async function findPairRow(
  db: SqliteDb,
  userA: string,
  userB: string,
): Promise<FriendshipRow | undefined> {
  const rows = await db
    .select()
    .from(userFriendships)
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
    )
    .limit(1);
  const row = rows[0];
  if (!row) return undefined;
  return row as FriendshipRow;
}

export async function areFriends(
  db: SqliteDb,
  userA: string,
  userB: string,
): Promise<boolean> {
  const row = await findPairRow(db, userA, userB);
  return row?.status === "accepted";
}

export async function listAcceptedFriendUserIds(
  db: SqliteDb,
  userId: string,
): Promise<string[]> {
  const rows = await db
    .select()
    .from(userFriendships)
    .where(
      and(
        eq(userFriendships.status, "accepted"),
        or(
          eq(userFriendships.requesterUserId, userId),
          eq(userFriendships.addresseeUserId, userId),
        ),
      ),
    );
  const ids = rows.map((r) =>
    r.requesterUserId === userId ? r.addresseeUserId : r.requesterUserId,
  );
  return filterOutBlockedUserIds(db, userId, ids);
}

export async function sendFriendRequest(
  db: SqliteDb,
  requesterUserId: string,
  targetUserId: string,
): Promise<
  | { ok: true; friendship: FriendshipRow; autoAccepted: boolean }
  | {
      ok: false;
      error:
        | "cannot_friend_self"
        | "user_not_found"
        | "already_friends"
        | "request_pending"
        | "blocked";
    }
> {
  if (requesterUserId === targetUserId) {
    return { ok: false, error: "cannot_friend_self" };
  }
  if (await hasBlockBetween(db, requesterUserId, targetUserId)) {
    return { ok: false, error: "blocked" };
  }
  const target = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, targetUserId))
    .limit(1);
  if (!target[0]) return { ok: false, error: "user_not_found" };

  const existing = await findPairRow(db, requesterUserId, targetUserId);
  if (existing?.status === "accepted") {
    return { ok: false, error: "already_friends" };
  }
  if (existing?.status === "pending") {
    return { ok: false, error: "request_pending" };
  }

  const now = new Date().toISOString();
  const reciprocal = await db
    .select()
    .from(userFriendships)
    .where(
      and(
        eq(userFriendships.requesterUserId, targetUserId),
        eq(userFriendships.addresseeUserId, requesterUserId),
        eq(userFriendships.status, "pending"),
      ),
    )
    .limit(1);

  if (reciprocal[0]) {
    await db
      .update(userFriendships)
      .set({ status: "accepted", updatedAt: now })
      .where(eq(userFriendships.id, reciprocal[0].id));
    return {
      ok: true,
      autoAccepted: true,
      friendship: { ...(reciprocal[0] as FriendshipRow), status: "accepted", updatedAt: now },
    };
  }

  const id = nanoid();
  await db.insert(userFriendships).values({
    id,
    requesterUserId,
    addresseeUserId: targetUserId,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  });
  return {
    ok: true,
    autoAccepted: false,
    friendship: {
      id,
      requesterUserId,
      addresseeUserId: targetUserId,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    },
  };
}

export async function acceptFriendRequest(
  db: SqliteDb,
  addresseeUserId: string,
  friendshipId: string,
): Promise<
  | { ok: true; friendship: FriendshipRow }
  | {
      ok: false;
      error: "friendship_not_found" | "not_authorized" | "blocked";
    }
> {
  const rows = await db
    .select()
    .from(userFriendships)
    .where(eq(userFriendships.id, friendshipId))
    .limit(1);
  const row = rows[0] as FriendshipRow | undefined;
  if (!row) return { ok: false, error: "friendship_not_found" };
  if (row.addresseeUserId !== addresseeUserId) {
    return { ok: false, error: "not_authorized" };
  }
  if (await hasBlockBetween(db, addresseeUserId, row.requesterUserId)) {
    return { ok: false, error: "blocked" };
  }
  const now = new Date().toISOString();
  await db
    .update(userFriendships)
    .set({ status: "accepted", updatedAt: now })
    .where(eq(userFriendships.id, friendshipId));
  return {
    ok: true,
    friendship: { ...row, status: "accepted", updatedAt: now },
  };
}

export async function listFriends(
  db: SqliteDb,
  userId: string,
): Promise<
  { userId: string; displayName: string; friendshipId: string }[]
> {
  const rows = await db
    .select()
    .from(userFriendships)
    .where(
      and(
        eq(userFriendships.status, "accepted"),
        or(
          eq(userFriendships.requesterUserId, userId),
          eq(userFriendships.addresseeUserId, userId),
        ),
      ),
    );
  const out: { userId: string; displayName: string; friendshipId: string }[] = [];
  for (const r of rows) {
    const friendId =
      r.requesterUserId === userId ? r.addresseeUserId : r.requesterUserId;
    if (await hasBlockBetween(db, userId, friendId)) continue;
    const u = await db
      .select({ displayName: users.displayName })
      .from(users)
      .where(eq(users.id, friendId))
      .limit(1);
    out.push({
      userId: friendId,
      displayName: u[0]?.displayName ?? friendId,
      friendshipId: r.id,
    });
  }
  return out;
}

export async function listFriendRequests(
  db: SqliteDb,
  userId: string,
): Promise<{
  incoming: {
    friendshipId: string;
    fromUserId: string;
    displayName: string;
    createdAt: string;
  }[];
  outgoing: {
    friendshipId: string;
    toUserId: string;
    displayName: string;
    createdAt: string;
  }[];
}> {
  const incomingRows = await db
    .select()
    .from(userFriendships)
    .where(
      and(
        eq(userFriendships.addresseeUserId, userId),
        eq(userFriendships.status, "pending"),
      ),
    );
  const outgoingRows = await db
    .select()
    .from(userFriendships)
    .where(
      and(
        eq(userFriendships.requesterUserId, userId),
        eq(userFriendships.status, "pending"),
      ),
    );

  const incoming = [];
  for (const r of incomingRows) {
    if (await hasBlockBetween(db, userId, r.requesterUserId)) continue;
    const u = await db
      .select({ displayName: users.displayName })
      .from(users)
      .where(eq(users.id, r.requesterUserId))
      .limit(1);
    incoming.push({
      friendshipId: r.id,
      fromUserId: r.requesterUserId,
      displayName: u[0]?.displayName ?? r.requesterUserId,
      createdAt: r.createdAt,
    });
  }

  const outgoing = [];
  for (const r of outgoingRows) {
    if (await hasBlockBetween(db, userId, r.addresseeUserId)) continue;
    const u = await db
      .select({ displayName: users.displayName })
      .from(users)
      .where(eq(users.id, r.addresseeUserId))
      .limit(1);
    outgoing.push({
      friendshipId: r.id,
      toUserId: r.addresseeUserId,
      displayName: u[0]?.displayName ?? r.addresseeUserId,
      createdAt: r.createdAt,
    });
  }

  return { incoming, outgoing };
}
