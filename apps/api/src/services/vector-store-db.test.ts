import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { InMemoryVectorStore, mockEmbed } from "@huhu/ai";
import { rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createDb } from "../db/index.js";
import { characters, users } from "../db/schema.js";
import {
  DbVectorStore,
  indexMessageAsMemory,
  listMemoriesForCharacter,
  deleteMemoryForCharacter,
} from "./vector-store-db.js";

async function seedCharacter(db: ReturnType<typeof createDb>["db"], id: string) {
  const now = new Date().toISOString();
  await db.insert(users).values({
    id: "u-test",
    displayName: "test",
    staminaUpdatedAt: now,
    createdAt: now,
  });
  await db.insert(characters).values({
    id,
    userId: "u-test",
    name: "Test",
    personality: "gentle",
    backstory: "test",
    speakingStyle: "warm",
    createdAt: now,
  });
}

describe("indexMessageAsMemory", () => {
  it("scrubs PII before upserting vector memory", async () => {
    const store = new InMemoryVectorStore();
    await indexMessageAsMemory(
      store,
      "c1",
      "聯絡 secret.user@example.com 我會在週末回覆你的訊息",
      "mem-pii",
    );
    const chunks = await store.search("c1", mockEmbed("週末聯絡"), 5);
    expect(chunks.length).toBe(1);
    expect(chunks[0]!.content).toContain("[EMAIL]");
    expect(chunks[0]!.content).not.toContain("secret.user@example.com");
  });
});

describe("listMemoriesForCharacter", () => {
  let dbPath: string;
  let db: ReturnType<typeof createDb>["db"];
  let close: () => void;

  beforeEach(() => {
    dbPath = join(tmpdir(), `huhu-mem-${Date.now()}.sqlite`);
    const handle = createDb(dbPath);
    db = handle.db;
    close = handle.close;
  });

  afterEach(() => {
    close();
    rmSync(dbPath, { force: true });
  });

  it("lists previews and deletes a single chunk", async () => {
    const characterId = "char-list";
    await seedCharacter(db, characterId);
    const store = new DbVectorStore(db);
    await indexMessageAsMemory(
      store,
      characterId,
      "週末最喜歡去海邊看夕陽散步",
      "mem-a",
    );
    const rows = await listMemoriesForCharacter(db, characterId);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0]!.preview.length).toBeLessThanOrEqual(121);

    const deleted = await deleteMemoryForCharacter(
      db,
      store,
      characterId,
      rows[0]!.id,
    );
    expect(deleted).toBe(true);
    expect(await listMemoriesForCharacter(db, characterId)).toHaveLength(0);
  });
});
