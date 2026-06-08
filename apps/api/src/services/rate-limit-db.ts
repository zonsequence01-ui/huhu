import { eq } from "drizzle-orm";
import { rateLimitBuckets } from "../db/schema-bindings.js";
import type { Db } from "../db/types.js";

/** Persistent rate limit bucket (SQLite or Postgres via Drizzle). */
export async function checkRateLimitDb(
  db: Db,
  key: string,
  max: number,
  windowMs: number,
  now = Date.now(),
): Promise<boolean> {
  const rows = await db
    .select()
    .from(rateLimitBuckets)
    .where(eq(rateLimitBuckets.bucketKey, key))
    .limit(1);
  const row = rows[0];
  if (!row || now >= row.resetAt) {
    await db
      .insert(rateLimitBuckets)
      .values({ bucketKey: key, count: 1, resetAt: now + windowMs })
      .onConflictDoUpdate({
        target: rateLimitBuckets.bucketKey,
        set: { count: 1, resetAt: now + windowMs },
      });
    return true;
  }
  if (row.count >= max) return false;
  await db
    .update(rateLimitBuckets)
    .set({ count: row.count + 1 })
    .where(eq(rateLimitBuckets.bucketKey, key));
  return true;
}

export async function clearRateLimitBucketsForTests(db: Db): Promise<void> {
  await db.delete(rateLimitBuckets);
}
