import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { buildApp } from "./app.js";
import {
  isPostgresDatabaseUrl,
  resolveDatabaseUrl,
} from "./db/create-database.js";
import { assertProductionRuntimeConfig } from "./services/runtime-config.js";

assertProductionRuntimeConfig();

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? "0.0.0.0";
const dbUrl = resolveDatabaseUrl();

const appOpts = isPostgresDatabaseUrl(dbUrl)
  ? { databaseUrl: dbUrl }
  : (() => {
      const dbPath = dbUrl.replace(/^file:/, "");
      mkdirSync(dirname(dbPath), { recursive: true });
      return { dbPath };
    })();

const { app } = await buildApp({
  ...appOpts,
  logger: process.env.NODE_ENV !== "test",
});

await app.listen({ port, host });
console.log(`Huhu API listening on http://${host}:${port}`);
