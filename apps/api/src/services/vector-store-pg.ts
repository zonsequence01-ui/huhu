import pg from "pg";
import type { VectorStore, MemoryChunk } from "@huhu/ai";

const DIM = Number(process.env.VECTOR_DIMENSION ?? 384);

function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

function parseVectorText(raw: string): number[] {
  const trimmed = raw.replace(/^\[|\]$/g, "");
  if (!trimmed) return [];
  return trimmed.split(",").map((x) => Number.parseFloat(x.trim()));
}

export class PgVectorStore implements VectorStore {
  constructor(private pool: pg.Pool) {}

  async ensureSchema(): Promise<void> {
    await this.pool.query("CREATE EXTENSION IF NOT EXISTS vector");
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS rag_memory_chunks (
        id TEXT PRIMARY KEY,
        character_id TEXT NOT NULL,
        content TEXT NOT NULL,
        embedding vector(${DIM}) NOT NULL,
        importance REAL NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ NOT NULL
      )
    `);
    await this.pool.query(`
      CREATE INDEX IF NOT EXISTS rag_memory_chunks_character_id_idx
      ON rag_memory_chunks (character_id)
    `);
  }

  async upsert(chunk: MemoryChunk): Promise<void> {
    const embedding = toVectorLiteral(chunk.embedding);
    await this.pool.query(
      `INSERT INTO rag_memory_chunks (id, character_id, content, embedding, importance, created_at)
       VALUES ($1, $2, $3, $4::vector, $5, $6)
       ON CONFLICT (id) DO UPDATE SET
         content = EXCLUDED.content,
         embedding = EXCLUDED.embedding,
         importance = EXCLUDED.importance`,
      [
        chunk.id,
        chunk.characterId,
        chunk.content,
        embedding,
        chunk.importance,
        chunk.createdAt,
      ],
    );
  }

  async deleteById(id: string): Promise<void> {
    await this.pool.query(`DELETE FROM rag_memory_chunks WHERE id = $1`, [id]);
  }

  async deleteForCharacter(characterId: string): Promise<void> {
    await this.pool.query(
      `DELETE FROM rag_memory_chunks WHERE character_id = $1`,
      [characterId],
    );
  }

  async search(
    characterId: string,
    queryEmbedding: number[],
    limit: number,
  ): Promise<MemoryChunk[]> {
    const embedding = toVectorLiteral(queryEmbedding);
    const res = await this.pool.query<{
      id: string;
      character_id: string;
      content: string;
      embedding: string;
      importance: number;
      created_at: Date;
    }>(
      `SELECT id, character_id, content, embedding::text AS embedding, importance, created_at
       FROM rag_memory_chunks
       WHERE character_id = $1
       ORDER BY embedding <=> $2::vector
       LIMIT $3`,
      [characterId, embedding, limit],
    );

    return res.rows.map((row) => ({
      id: row.id,
      characterId: row.character_id,
      content: row.content,
      embedding: parseVectorText(row.embedding),
      importance: row.importance,
      createdAt:
        row.created_at instanceof Date
          ? row.created_at.toISOString()
          : String(row.created_at),
    }));
  }
}

export function createPgPool(connectionString: string): pg.Pool {
  return new pg.Pool({ connectionString });
}
