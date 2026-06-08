import { describe, expect, it } from "vitest";
import { InMemoryVectorStore, mockEmbed, retrieveMemories } from "./rag.js";

describe("RAG retrieval", () => {
  it("returns relevant memories for character", async () => {
    const store = new InMemoryVectorStore();
    await store.upsert({
      id: "1",
      characterId: "c1",
      content: "使用者討厭青椒",
      embedding: mockEmbed("討厭青椒"),
      importance: 2,
      createdAt: new Date().toISOString(),
    });
    await store.upsert({
      id: "2",
      characterId: "c1",
      content: "今天天氣很好",
      embedding: mockEmbed("天氣很好"),
      importance: 1,
      createdAt: new Date().toISOString(),
    });
    const memories = await retrieveMemories(store, "c1", "晚餐不要吃青椒", 2);
    expect(memories.some((m) => m.includes("青椒"))).toBe(true);
  });

  it("scrubs PII from retrieval query", async () => {
    const store = new InMemoryVectorStore();
    await store.upsert({
      id: "1",
      characterId: "c1",
      content: "使用者討厭青椒",
      embedding: mockEmbed("討厭青椒"),
      importance: 1,
      createdAt: new Date().toISOString(),
    });
    const memories = await retrieveMemories(
      store,
      "c1",
      "寄信 secret@test.com 關於青椒",
      1,
    );
    expect(memories.length).toBeGreaterThan(0);
  });
});
