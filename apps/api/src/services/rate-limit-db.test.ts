import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createDb } from "../db/sqlite-db.js";
import {
  checkRateLimit,
  initRateLimitStore,
  resetRateLimitsForTests,
} from "./rate-limit.js";
import { clearRateLimitBucketsForTests } from "./rate-limit-db.js";

describe("rate-limit-db", () => {
  let tmpDir: string;
  let db: ReturnType<typeof createDb>["db"];
  const prevBackend = process.env.RATE_LIMIT_BACKEND;

  beforeEach(async () => {
    resetRateLimitsForTests();
    tmpDir = mkdtempSync(join(tmpdir(), "huhu-rl-"));
    db = createDb(join(tmpDir, "t.db")).db;
    process.env.RATE_LIMIT_BACKEND = "db";
    initRateLimitStore(db);
    await clearRateLimitBucketsForTests(db);
  });

  afterEach(() => {
    process.env.RATE_LIMIT_BACKEND = prevBackend;
    resetRateLimitsForTests();
    try {
      rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      /* Windows sqlite lock */
    }
  });

  it("persists buckets across in-process resets", async () => {
    expect(await checkRateLimit("persist-k", 1, 60_000, 0)).toBe(true);
    expect(await checkRateLimit("persist-k", 1, 60_000, 0)).toBe(false);
    resetRateLimitsForTests();
    initRateLimitStore(db);
    expect(await checkRateLimit("persist-k", 1, 60_000, 0)).toBe(false);
  });

  it("resets bucket after window elapses", async () => {
    expect(await checkRateLimit("win-k", 1, 100, 0)).toBe(true);
    expect(await checkRateLimit("win-k", 1, 100, 0)).toBe(false);
    expect(await checkRateLimit("win-k", 1, 100, 101)).toBe(true);
  });
});
