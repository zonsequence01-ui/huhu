import type { VectorStore } from "@huhu/ai";
import type { DatabaseDriver } from "../db/create-database.js";
import type { Db } from "../db/index.js";
import { DbVectorStore } from "./vector-store-db.js";
import { PgVectorStore, createPgPool } from "./vector-store-pg.js";

export interface VectorStoreHandle {
  store: VectorStore;
  close?: () => Promise<void>;
}

function resolvePgVectorUrl(appDatabaseUrl?: string): string | undefined {
  if (process.env.VECTOR_STORE === "sqlite") return undefined;
  const explicit = process.env.PGVECTOR_URL?.trim();
  if (explicit) return explicit;
  const dbUrl = (appDatabaseUrl ?? process.env.DATABASE_URL)?.trim();
  if (dbUrl?.startsWith("postgresql://") || dbUrl?.startsWith("postgres://")) {
    return dbUrl;
  }
  return undefined;
}

export function resolveVectorStoreKind(
  dbDriver: DatabaseDriver,
  appDatabaseUrl?: string,
): string {
  if (process.env.VECTOR_STORE === "sqlite") return "sqlite-embeddings";
  const pgUrl = resolvePgVectorUrl(appDatabaseUrl);
  if (pgUrl) return dbDriver === "postgres" ? "pgvector" : "pgvector-external";
  return "sqlite-embeddings";
}

/** SQLite embeddings by default; optional Postgres+pgvector when PGVECTOR_URL or postgres DATABASE_URL is set. */
export async function createVectorStore(
  db: Db,
  appDatabaseUrl?: string,
): Promise<VectorStoreHandle> {
  const pgUrl = resolvePgVectorUrl(appDatabaseUrl);
  if (!pgUrl) {
    return { store: new DbVectorStore(db) };
  }

  const pool = createPgPool(pgUrl);
  const store = new PgVectorStore(pool);
  try {
    await store.ensureSchema();
  } catch (err) {
    await pool.end();
    throw err;
  }
  return {
    store,
    close: async () => {
      await pool.end();
    },
  };
}
