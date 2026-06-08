import { describe, expect, it, beforeEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createDb } from "../db/sqlite-db.js";
import { users } from "../db/schema-bindings.js";
import {
  blockUser,
  hasBlockBetween,
  filterOutBlockedUserIds,
} from "./user-block.js";

describe("user-block", () => {
  let tmpDir: string;
  let db: ReturnType<typeof createDb>["db"];

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "huhu-block-"));
    db = createDb(join(tmpDir, "t.db")).db;
    const now = new Date().toISOString();
    for (const [id, name] of [
      ["u1", "One"],
      ["u2", "Two"],
    ] as const) {
      db.insert(users).values({
        id,
        displayName: name,
        locale: "zh-TW",
        subscriptionTier: "free",
        stamina: 50,
        staminaUpdatedAt: now,
        coins: 0,
        createdAt: now,
      }).run();
    }
  });

  it("blocks bidirectionally for interactions", async () => {
    expect(await blockUser(db, "u1", "u2")).toEqual({ ok: true });
    expect(await hasBlockBetween(db, "u1", "u2")).toBe(true);
    expect(await hasBlockBetween(db, "u2", "u1")).toBe(true);
  });

  it("filters blocked ids from candidate list", async () => {
    await blockUser(db, "u1", "u2");
    const filtered = await filterOutBlockedUserIds(db, "u1", ["u2"]);
    expect(filtered).toEqual([]);
  });
});

