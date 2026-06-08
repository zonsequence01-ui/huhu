import type { SqliteDb } from "./sqlite-db.js";

/**
 * Drizzle DB handle (SQLite or PostgreSQL). Runtime schema bindings align table names.
 */
export type Db = SqliteDb;
