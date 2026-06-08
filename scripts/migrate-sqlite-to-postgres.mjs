#!/usr/bin/env node
/**
 * One-shot SQLite → PostgreSQL data copy.
 * Usage:
 *   SQLITE_PATH=./data/huhu.db DATABASE_URL=postgresql://huhu:huhu@localhost:5432/huhu node scripts/migrate-sqlite-to-postgres.mjs
 */
import Database from "better-sqlite3";
import pg from "pg";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const sqlitePath = process.env.SQLITE_PATH ?? "./data/huhu.db";
const pgUrl = process.env.DATABASE_URL;
if (!pgUrl?.startsWith("postgres")) {
  console.error("DATABASE_URL must be a postgresql:// connection string");
  process.exit(1);
}

const sqlite = new Database(sqlitePath, { readonly: true });
const pool = new pg.Pool({ connectionString: pgUrl });

const dir = dirname(fileURLToPath(import.meta.url));
const initSql = readFileSync(join(dir, "init-postgres-app.sql"), "utf8");
await pool.query(initSql);

const tables = [
  {
    name: "users",
    cols: [
      "id",
      "display_name",
      "locale",
      "subscription_tier",
      "subscription_expires_at",
      "stamina",
      "stamina_updated_at",
      "coins",
      "offerwall_claims_date",
      "offerwall_claims_count",
      "daily_checkin_date",
      "subscription_coins_grant_month",
      "age_confirmed_at",
      "created_at",
    ],
  },
  {
    name: "characters",
    cols: [
      "id",
      "user_id",
      "name",
      "gender",
      "personality",
      "backstory",
      "speaking_style",
      "locale",
      "created_at",
    ],
  },
  {
    name: "relationships",
    cols: ["character_id", "affection", "stage", "updated_at"],
  },
  {
    name: "messages",
    cols: ["id", "character_id", "role", "content", "mode", "created_at"],
  },
  {
    name: "offerwall_redemptions",
    cols: ["transaction_id", "user_id", "created_at"],
  },
  {
    name: "iap_receipts",
    cols: ["receipt_key", "user_id", "product_id", "platform", "created_at"],
  },
];

for (const { name, cols } of tables) {
  let rows;
  try {
    rows = sqlite.prepare(`SELECT * FROM ${name}`).all();
  } catch {
    console.log(`skip ${name} (missing in sqlite)`);
    continue;
  }
  for (const row of rows) {
    const values = cols.map((c) => row[c]);
    const placeholders = cols.map((_, i) => `$${i + 1}`).join(", ");
    await pool.query(
      `INSERT INTO ${name} (${cols.join(", ")}) VALUES (${placeholders})
       ON CONFLICT DO NOTHING`,
      values,
    );
  }
  console.log(`migrated ${name}: ${rows.length} rows`);
}

if (process.env.VECTOR_STORE === "sqlite") {
  const mem = sqlite.prepare("SELECT * FROM memory_chunks").all();
  for (const row of mem) {
    await pool.query(
      `INSERT INTO memory_chunks (id, character_id, content, embedding_json, importance, created_at)
       VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING`,
      [
        row.id,
        row.character_id,
        row.content,
        row.embedding_json,
        row.importance,
        row.created_at,
      ],
    );
  }
  console.log(`migrated memory_chunks: ${mem.length} rows`);
}

await pool.end();
sqlite.close();
console.log("done");
