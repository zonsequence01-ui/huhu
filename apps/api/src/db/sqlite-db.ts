import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema.js";

export function createDb(path: string) {
  const sqlite = new Database(path);
  sqlite.pragma("journal_mode = WAL");
  const close = () => sqlite.close();
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      display_name TEXT NOT NULL,
      locale TEXT NOT NULL DEFAULT 'zh-TW',
      subscription_tier TEXT NOT NULL DEFAULT 'free',
      stamina INTEGER NOT NULL DEFAULT 50,
      stamina_updated_at TEXT NOT NULL,
      coins INTEGER NOT NULL DEFAULT 0,
      offerwall_claims_date TEXT,
      offerwall_claims_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);
  try {
    sqlite.exec(`ALTER TABLE users ADD COLUMN offerwall_claims_date TEXT`);
  } catch {
    /* column exists */
  }
  try {
    sqlite.exec(
      `ALTER TABLE users ADD COLUMN offerwall_claims_count INTEGER NOT NULL DEFAULT 0`,
    );
  } catch {
    /* column exists */
  }
  try {
    sqlite.exec(`ALTER TABLE users ADD COLUMN daily_checkin_date TEXT`);
  } catch {
    /* column exists */
  }
  try {
    sqlite.exec(`ALTER TABLE users ADD COLUMN subscription_expires_at TEXT`);
  } catch {
    /* column exists */
  }
  try {
    sqlite.exec(
      `ALTER TABLE users ADD COLUMN subscription_coins_grant_month TEXT`,
    );
  } catch {
    /* column exists */
  }
  try {
    sqlite.exec(`ALTER TABLE users ADD COLUMN age_confirmed_at TEXT`);
  } catch {
    /* column exists */
  }
  try {
    sqlite.exec(`ALTER TABLE users ADD COLUMN invite_code TEXT`);
  } catch {
    /* column exists */
  }
  try {
    sqlite.exec(
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_users_invite_code ON users(invite_code) WHERE invite_code IS NOT NULL`,
    );
  } catch {
    /* index exists */
  }
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS characters (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      gender TEXT,
      personality TEXT NOT NULL,
      backstory TEXT NOT NULL,
      speaking_style TEXT NOT NULL,
      locale TEXT NOT NULL DEFAULT 'zh-TW',
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS relationships (
      character_id TEXT PRIMARY KEY REFERENCES characters(id),
      affection INTEGER NOT NULL DEFAULT 0,
      stage TEXT NOT NULL DEFAULT 'stranger',
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      character_id TEXT NOT NULL REFERENCES characters(id),
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      mode TEXT NOT NULL DEFAULT 'simple',
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS offerwall_redemptions (
      transaction_id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS memory_chunks (
      id TEXT PRIMARY KEY,
      character_id TEXT NOT NULL REFERENCES characters(id),
      content TEXT NOT NULL,
      embedding_json TEXT NOT NULL,
      importance REAL NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS iap_receipts (
      receipt_key TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      product_id TEXT NOT NULL,
      platform TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS diary_entries (
      id TEXT PRIMARY KEY,
      character_id TEXT NOT NULL REFERENCES characters(id),
      title TEXT,
      body TEXT NOT NULL,
      mood TEXT,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS character_moments (
      id TEXT PRIMARY KEY,
      character_id TEXT NOT NULL REFERENCES characters(id),
      body TEXT NOT NULL,
      media_json TEXT,
      visibility TEXT NOT NULL DEFAULT 'private',
      moderation_status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS moment_reports (
      id TEXT PRIMARY KEY,
      moment_id TEXT NOT NULL REFERENCES character_moments(id),
      reporter_user_id TEXT NOT NULL REFERENCES users(id),
      reason TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(moment_id, reporter_user_id)
    );
    CREATE TABLE IF NOT EXISTS rate_limit_buckets (
      bucket_key TEXT PRIMARY KEY,
      count INTEGER NOT NULL,
      reset_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS user_blocks (
      id TEXT PRIMARY KEY,
      blocker_user_id TEXT NOT NULL REFERENCES users(id),
      blocked_user_id TEXT NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL,
      UNIQUE(blocker_user_id, blocked_user_id)
    );
    CREATE TABLE IF NOT EXISTS user_friendships (
      id TEXT PRIMARY KEY,
      requester_user_id TEXT NOT NULL REFERENCES users(id),
      addressee_user_id TEXT NOT NULL REFERENCES users(id),
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(requester_user_id, addressee_user_id)
    );
  `);
  try {
    sqlite.exec(`ALTER TABLE messages ADD COLUMN media_json TEXT`);
  } catch {
    /* column exists */
  }
  try {
    sqlite.exec(
      `ALTER TABLE character_moments ADD COLUMN visibility TEXT NOT NULL DEFAULT 'private'`,
    );
  } catch {
    /* column exists */
  }
  try {
    sqlite.exec(
      `ALTER TABLE character_moments ADD COLUMN moderation_status TEXT NOT NULL DEFAULT 'active'`,
    );
  } catch {
    /* column exists */
  }
  try {
    sqlite.exec(`CREATE TABLE IF NOT EXISTS moment_reports (
      id TEXT PRIMARY KEY,
      moment_id TEXT NOT NULL REFERENCES character_moments(id),
      reporter_user_id TEXT NOT NULL REFERENCES users(id),
      reason TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(moment_id, reporter_user_id)
    )`);
  } catch {
    /* exists */
  }
  try {
    sqlite.exec(`CREATE TABLE IF NOT EXISTS rate_limit_buckets (
      bucket_key TEXT PRIMARY KEY,
      count INTEGER NOT NULL,
      reset_at INTEGER NOT NULL
    )`);
  } catch {
    /* exists */
  }
  try {
    sqlite.exec(`CREATE TABLE IF NOT EXISTS user_blocks (
      id TEXT PRIMARY KEY,
      blocker_user_id TEXT NOT NULL REFERENCES users(id),
      blocked_user_id TEXT NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL,
      UNIQUE(blocker_user_id, blocked_user_id)
    )`);
  } catch {
    /* exists */
  }
  try {
    sqlite.exec(`CREATE TABLE IF NOT EXISTS user_friendships (
      id TEXT PRIMARY KEY,
      requester_user_id TEXT NOT NULL REFERENCES users(id),
      addressee_user_id TEXT NOT NULL REFERENCES users(id),
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(requester_user_id, addressee_user_id)
    )`);
  } catch {
    /* exists */
  }
  try {
    sqlite.exec(`CREATE TABLE IF NOT EXISTS iap_receipts (
      receipt_key TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      product_id TEXT NOT NULL,
      platform TEXT NOT NULL,
      created_at TEXT NOT NULL
    )`);
  } catch {
    /* exists */
  }
  const db = drizzle(sqlite, { schema });
  return { db, close };
}

export type SqliteDb = ReturnType<typeof createDb>["db"];
