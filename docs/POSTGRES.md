# PostgreSQL + pgvector 遷移指引

【假設】生產環境採 PostgreSQL 15+ 與 [pgvector](https://github.com/pgvector/pgvector) 擴充。

## 啟用本機 Postgres（可選）

```bash
docker compose --profile postgres up -d postgres
```

連線字串：`postgresql://huhu:huhu@localhost:5432/huhu`

## 應用資料庫（已實作）

設定 `DATABASE_URL=postgresql://huhu:huhu@localhost:5432/huhu` 時，API 透過 `createDatabase()` 使用 **Drizzle node-postgres**（`apps/api/src/db/schema-pg.ts`、`pg-init.ts`）。  
未設定時預設 `file:./data/huhu.db`（SQLite）。

手動初始化（可選）：`scripts/init-postgres-app.sql`

啟動範例：

```bash
set DATABASE_URL=postgresql://huhu:huhu@localhost:5432/huhu
pnpm --filter @huhu/api dev
```

`GET /health` 回傳 `database: "postgres" | "sqlite"`。

## 向量庫

設定 `PGVECTOR_URL` 或（未設 `VECTOR_STORE=sqlite` 時）`DATABASE_URL=postgresql://...` 時，RAG 記憶改寫入 **PgVectorStore**。  
在 Postgres 上若要用 SQLite 式 `embedding_json` 表：設 `VECTOR_STORE=sqlite`（會建立 `memory_chunks` 文字欄位表）。

初始化 SQL：`scripts/init-pgvector.sql`（維度預設 384，與 `VECTOR_DIMENSION` 一致）。

## 資料遷移（一次性）

```bash
docker compose --profile postgres up -d postgres
set SQLITE_PATH=./data/huhu.db
set DATABASE_URL=postgresql://huhu:huhu@localhost:5432/huhu
node scripts/migrate-sqlite-to-postgres.mjs
```

RAG 向量表名為 `rag_memory_chunks`（與 Drizzle `memory_chunks` 文字欄位表分離）。`VECTOR_STORE=sqlite` 時遷移腳本會一併複製 SQLite 嵌入 JSON 表。

## 整合測試

```bash
set TEST_DATABASE_URL=postgresql://huhu:huhu@localhost:5432/huhu
pnpm --filter @huhu/api test
```

未設定 `TEST_DATABASE_URL` 時 Postgres 測試自動跳過。

## SQL 參考（記憶表）

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE rag_memory_chunks (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL REFERENCES characters(id),
  content TEXT NOT NULL,
  embedding vector(384) NOT NULL,
  importance REAL NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX memory_chunks_embedding_idx
  ON memory_chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
```

## 風險

- OpenAI `text-embedding-3-small` 維度為 1536，mock 為 384；遷移前需統一 `VECTOR_DIMENSION`。
