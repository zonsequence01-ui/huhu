-- Application tables (RAG vectors: scripts/init-pgvector.sql or PgVectorStore.ensureSchema)

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
