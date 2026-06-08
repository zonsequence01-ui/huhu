import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as pgSchema from "./schema-pg.js";
import { createDb } from "./sqlite-db.js";
import type { Db } from "./types.js";
import { ensurePostgresAppSchema } from "./pg-init.js";
import { usePostgresSchema, useSqliteSchema } from "./schema-bindings.js";

export type DatabaseDriver = "sqlite" | "postgres";

export function isPostgresDatabaseUrl(url: string): boolean {
  const u = url.trim();
  return u.startsWith("postgresql://") || u.startsWith("postgres://");
}

export function resolveDatabaseUrl(): string {
  return process.env.DATABASE_URL?.trim() ?? "file:./data/huhu.db";
}

export interface DatabaseHandle {
  db: Db;
  close: () => void | Promise<void>;
  driver: DatabaseDriver;
  connectionLabel: string;
}

export interface CreateDatabaseOptions {
  /** Full URL (`postgresql://...`) or omitted to use DATABASE_URL / SQLite path */
  url?: string;
  /** SQLite file path when not using Postgres */
  path?: string;
}

export async function createDatabase(
  options: CreateDatabaseOptions = {},
): Promise<DatabaseHandle> {
  const explicitUrl = options.url?.trim();
  const url =
    explicitUrl ??
    (options.path ? `file:${options.path}` : resolveDatabaseUrl());

  if (isPostgresDatabaseUrl(url)) {
    usePostgresSchema();
    const pool = new pg.Pool({ connectionString: url });
    await ensurePostgresAppSchema(pool);
    const db = drizzle(pool, { schema: pgSchema });
    let poolClosed = false;
    return {
      db: db as unknown as Db,
      driver: "postgres",
      connectionLabel: url.replace(/:[^:@/]+@/, ":***@"),
      close: async () => {
        if (poolClosed) return;
        poolClosed = true;
        await pool.end();
      },
    };
  }

  useSqliteSchema();
  const path =
    options.path ?? (url.replace(/^file:/, "") || "./data/huhu.db");
  const { db, close } = createDb(path);
  return {
    db,
    driver: "sqlite",
    connectionLabel: path,
    close: () => {
      close();
    },
  };
}
