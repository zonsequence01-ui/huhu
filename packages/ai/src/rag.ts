export interface MemoryChunk {
  id: string;
  characterId: string;
  content: string;
  embedding: number[];
  importance: number;
  createdAt: string;
}

export interface VectorStore {
  upsert(chunk: MemoryChunk): Promise<void>;
  search(
    characterId: string,
    queryEmbedding: number[],
    limit: number,
  ): Promise<MemoryChunk[]>;
  deleteById?(id: string): Promise<void>;
  deleteForCharacter?(characterId: string): Promise<void>;
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

/** Deterministic mock embedding from text */
export function mockEmbed(text: string, dim = 384): number[] {
  const vec = new Array<number>(dim).fill(0);
  for (let i = 0; i < text.length; i++) {
    vec[i % dim]! += text.charCodeAt(i) / 1000;
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

export class InMemoryVectorStore implements VectorStore {
  private chunks: MemoryChunk[] = [];

  async upsert(chunk: MemoryChunk): Promise<void> {
    const idx = this.chunks.findIndex((c) => c.id === chunk.id);
    if (idx >= 0) this.chunks[idx] = chunk;
    else this.chunks.push(chunk);
  }

  async deleteById(id: string): Promise<void> {
    this.chunks = this.chunks.filter((c) => c.id !== id);
  }

  async search(
    characterId: string,
    queryEmbedding: number[],
    limit: number,
  ): Promise<MemoryChunk[]> {
    return this.chunks
      .filter((c) => c.characterId === characterId)
      .map((c) => ({
        chunk: c,
        score:
          cosineSimilarity(queryEmbedding, c.embedding) * (1 + c.importance * 0.1),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((x) => x.chunk);
  }
}

import { scrubPii } from "./pii.js";

export type EmbedFn = (text: string) => Promise<number[]>;

export async function retrieveMemories(
  store: VectorStore,
  characterId: string,
  query: string,
  limit: number,
  embedFn?: EmbedFn,
): Promise<string[]> {
  const embed = embedFn ?? (async (t) => mockEmbed(t));
  const embedding = await embed(scrubPii(query));
  const chunks = await store.search(characterId, embedding, limit);
  return chunks.map((c) => c.content);
}
