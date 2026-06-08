import { describe, expect, it, beforeEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createDb } from "../db/sqlite-db.js";
import { users } from "../db/schema-bindings.js";
import { ensureUserInviteCode } from "./invite-code.js";
import { searchUsers } from "./user-search.js";

describe("user-search", () => {
  let tmpDir: string;
  let db: ReturnType<typeof createDb>["db"];

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "huhu-search-"));
    db = createDb(join(tmpDir, "t.db")).db;
    const now = new Date().toISOString();
    db.insert(users)
      .values({
        id: "viewer",
        displayName: "Viewer",
        locale: "zh-TW",
        subscriptionTier: "free",
        stamina: 50,
        staminaUpdatedAt: now,
        coins: 0,
        createdAt: now,
      })
      .run();
    db.insert(users)
      .values({
        id: "target",
        displayName: "小呼迷友",
        locale: "zh-TW",
        subscriptionTier: "free",
        stamina: 50,
        staminaUpdatedAt: now,
        coins: 0,
        createdAt: now,
      })
      .run();
  });

  it("finds users by display name substring", async () => {
    const hits = await searchUsers(db, "viewer", "迷友");
    expect(hits).toHaveLength(1);
    expect(hits[0]?.userId).toBe("target");
    expect(hits[0]?.matchType).toBe("display_name");
  });

  it("finds users by invite code", async () => {
    const code = await ensureUserInviteCode(db, "target");
    const hits = await searchUsers(db, "viewer", code);
    expect(hits.some((h) => h.userId === "target")).toBe(true);
    expect(hits.find((h) => h.userId === "target")?.matchType).toBe(
      "invite_code",
    );
  });
});
