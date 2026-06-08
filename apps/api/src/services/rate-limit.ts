import type { Db } from "../db/types.js";
import { checkRateLimitDb } from "./rate-limit-db.js";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
let persistentDb: Db | null = null;

function usePersistentBackend(): boolean {
  const backend = process.env.RATE_LIMIT_BACKEND?.trim().toLowerCase();
  return (backend === "db" || backend === "postgres") && persistentDb != null;
}

/** Enable DB-backed buckets when `RATE_LIMIT_BACKEND=db` or `postgres`. */
export function initRateLimitStore(db: Db): void {
  const backend = process.env.RATE_LIMIT_BACKEND?.trim().toLowerCase();
  if (backend === "db" || backend === "postgres") {
    persistentDb = db;
  }
}

function checkRateLimitMemory(
  key: string,
  max: number,
  windowMs: number,
  now = Date.now(),
): boolean {
  const bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= max) return false;
  bucket.count += 1;
  return true;
}

/** Returns true if the action is allowed, false if rate limited. */
export async function checkRateLimit(
  key: string,
  max: number,
  windowMs: number,
  now = Date.now(),
): Promise<boolean> {
  if (usePersistentBackend() && persistentDb) {
    return checkRateLimitDb(persistentDb, key, max, windowMs, now);
  }
  return checkRateLimitMemory(key, max, windowMs, now);
}

export function resetRateLimitsForTests(): void {
  buckets.clear();
  persistentDb = null;
}