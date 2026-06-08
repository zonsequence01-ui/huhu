import type pg from "pg";

function useSqliteVectorOnPostgres(): boolean {
  return process.env.VECTOR_STORE === "sqlite";
}

/** Application tables for PostgreSQL (RAG vector table managed separately). */
export async function ensurePostgresAppSchema(pool: pg.Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      display_name TEXT NOT NULL,
      locale TEXT NOT NULL DEFAULT 'zh-TW',
      subscription_tier TEXT NOT NULL DEFAULT 'free',
      subscription_expires_at TEXT,
      stamina INTEGER NOT NULL DEFAULT 50,
      stamina_updated_at TEXT NOT NULL,
      coins INTEGER NOT NULL DEFAULT 0,
      offerwall_claims_date TEXT,
      offerwall_claims_count INTEGER NOT NULL DEFAULT 0,
      daily_checkin_date TEXT,
      subscription_coins_grant_month TEXT,
      age_confirmed_at TEXT,
      invite_code TEXT UNIQUE,
      created_at TEXT NOT NULL
    );
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
    await pool.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_json TEXT`);
  } catch {
    /* sqlite driver or older pg */
  }
  try {
    await pool.query(
      `ALTER TABLE character_moments ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'private'`,
    );
  } catch {
    /* column exists */
  }
  try {
    await pool.query(
      `ALTER TABLE character_moments ADD COLUMN IF NOT EXISTS moderation_status TEXT NOT NULL DEFAULT 'active'`,
    );
  } catch {
    /* column exists */
  }
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS moment_reports (
        id TEXT PRIMARY KEY,
        moment_id TEXT NOT NULL REFERENCES character_moments(id),
        reporter_user_id TEXT NOT NULL REFERENCES users(id),
        reason TEXT NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE(moment_id, reporter_user_id)
      )
    `);
  } catch {
    /* exists */
  }
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS rate_limit_buckets (
        bucket_key TEXT PRIMARY KEY,
        count INTEGER NOT NULL,
        reset_at INTEGER NOT NULL
      )
    `);
  } catch {
    /* exists */
  }
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_blocks (
        id TEXT PRIMARY KEY,
        blocker_user_id TEXT NOT NULL REFERENCES users(id),
        blocked_user_id TEXT NOT NULL REFERENCES users(id),
        created_at TEXT NOT NULL,
        UNIQUE(blocker_user_id, blocked_user_id)
      )
    `);
  } catch {
    /* exists */
  }
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_friendships (
        id TEXT PRIMARY KEY,
        requester_user_id TEXT NOT NULL REFERENCES users(id),
        addressee_user_id TEXT NOT NULL REFERENCES users(id),
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE(requester_user_id, addressee_user_id)
      )
    `);
  } catch {
    /* exists */
  }
  try {
    await pool.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS invite_code TEXT`,
    );
  } catch {
    /* exists */
  }
  try {
    await pool.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_users_invite_code ON users(invite_code) WHERE invite_code IS NOT NULL`,
    );
  } catch {
    /* exists */
  }

  if (useSqliteVectorOnPostgres()) {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS memory_chunks (
        id TEXT PRIMARY KEY,
        character_id TEXT NOT NULL REFERENCES characters(id),
        content TEXT NOT NULL,
        embedding_json TEXT NOT NULL,
        importance REAL NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL
      );
    `);
  }
}
