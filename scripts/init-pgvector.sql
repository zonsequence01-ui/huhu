CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS rag_memory_chunks (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(384) NOT NULL,
  importance REAL NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS rag_memory_chunks_character_id_idx
  ON rag_memory_chunks (character_id);
