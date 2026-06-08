import { eq } from "drizzle-orm";
import type { VectorStore, MemoryChunk } from "@huhu/ai";
import { createEmbedFn, scrubPii } from "@huhu/ai";
import type { Db } from "../db/index.js";
import { memoryChunks } from "../db/schema-bindings.js";

function parseEmbedding(json: string): number[] {
  return JSON.parse(json) as number[];
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    normA += a[i]! * a[i]!;
    normB += b[i]! * b[i]!;
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

export class DbVectorStore implements VectorStore {
  constructor(private db: Db) {}

  async upsert(chunk: MemoryChunk): Promise<void> {
    await this.db
      .insert(memoryChunks)
      .values({
        id: chunk.id,
        characterId: chunk.characterId,
        content: chunk.content,
        embeddingJson: JSON.stringify(chunk.embedding),
        importance: chunk.importance,
        createdAt: chunk.createdAt,
      })
      .onConflictDoUpdate({
        target: memoryChunks.id,
        set: {
          content: chunk.content,
          embeddingJson: JSON.stringify(chunk.embedding),
          importance: chunk.importance,
        },
      });
  }

  async deleteById(id: string): Promise<void> {
    await this.db.delete(memoryChunks).where(eq(memoryChunks.id, id));
  }

  async deleteForCharacter(characterId: string): Promise<void> {
    await this.db
      .delete(memoryChunks)
      .where(eq(memoryChunks.characterId, characterId));
  }

  async search(
    characterId: string,
    queryEmbedding: number[],
    limit: number,
  ): Promise<MemoryChunk[]> {
    const rows = await this.db
      .select()
      .from(memoryChunks)
      .where(eq(memoryChunks.characterId, characterId));

    return rows
      .map((row) => {
        const embedding = parseEmbedding(row.embeddingJson);
        const score =
          cosineSimilarity(queryEmbedding, embedding) *
          (1 + row.importance * 0.1);
        return {
          chunk: {
            id: row.id,
            characterId: row.characterId,
            content: row.content,
            embedding,
            importance: row.importance,
            createdAt: row.createdAt,
          },
          score,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((x) => x.chunk);
  }
}

export async function deleteMemoryById(
  store: VectorStore,
  id: string,
): Promise<void> {
  if (store.deleteById) {
    await store.deleteById(id);
  }
}

export type MemoryListItem = {
  id: string;
  preview: string;
  importance: number;
  createdAt: string;
};

const MEMORY_PREVIEW_MAX = 120;

export async function listMemoriesForCharacter(
  db: Db,
  characterId: string,
  limit = 50,
): Promise<MemoryListItem[]> {
  const rows = await db
    .select({
      id: memoryChunks.id,
      content: memoryChunks.content,
      importance: memoryChunks.importance,
      createdAt: memoryChunks.createdAt,
    })
    .from(memoryChunks)
    .where(eq(memoryChunks.characterId, characterId));

  return rows
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, limit)
    .map((row) => {
      const text = row.content.trim();
      const preview =
        text.length <= MEMORY_PREVIEW_MAX
          ? text
          : `${text.slice(0, MEMORY_PREVIEW_MAX)}…`;
      return {
        id: row.id,
        preview,
        importance: row.importance,
        createdAt: row.createdAt,
      };
    });
}

export async function deleteMemoryForCharacter(
  db: Db,
  store: VectorStore,
  characterId: string,
  memoryId: string,
): Promise<boolean> {
  const rows = await db
    .select({ id: memoryChunks.id })
    .from(memoryChunks)
    .where(eq(memoryChunks.characterId, characterId));
  const found = rows.some((r) => r.id === memoryId);
  if (!found) return false;
  await deleteMemoryById(store, memoryId);
  return true;
}

export async function indexMessageAsMemory(
  store: VectorStore,
  characterId: string,
  content: string,
  id: string,
  importance = 1,
): Promise<void> {
  const scrubbed = scrubPii(content);
  const embed = createEmbedFn();
  await store.upsert({
    id,
    characterId,
    content: scrubbed,
    embedding: await embed(scrubbed),
    importance,
    createdAt: new Date().toISOString(),
  });
}
