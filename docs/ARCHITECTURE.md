# Huhu 架構摘要

## 核心模組

| 模組 | 職責 |
|------|------|
| `@huhu/shared` | Bundle ID、體力參數、IAP SKU、ASO 市場、關係階段、訂閱定價基準 |
| `@huhu/economy` | 體力恢復（50 上限、10 分鐘 +1）、呼呼幣消耗、訂閱權益 |
| `@huhu/ai` | RAG 檢索、PII scrub、危機關鍵字、LLM 雙層路由 |
| `@huhu/api` | REST、SQLite 持久化、對話與關係狀態；`onRequest` 剝除空 body 的 JSON Content-Type |

## 對話流程

1. 安全檢測（危機關鍵字 → 資源訊息，不呼叫 LLM）
2. 體力 / 呼呼幣扣款（Lite+ 訂閱免體力）
3. RAG 檢索長期記憶（查詢 PII scrub）
4. 載入最近 12 則對話 + RAG 記憶，組裝 system prompt
5. PII 清洗後送 LLM（simple→light，long/exciting→premium）
6. 角色崩壞防護（`guardCharacterReply`，依角色 `locale` 多語系 fallback）
7. 寫入訊息、索引記憶（PII scrub）、每 20 則自動摘要、更新好感度

## 認證

- `POST /v1/users/bootstrap` 簽發 JWT（30 天）
- 其餘 `/v1/*` 需 `Authorization: Bearer <token>`
- `POST /v1/iap/verify` 收據驗證 stub（`valid_<productId>`）
- `PATCH /v1/users/me/subscription` 開發快速升級（非 production 可選 `expiresAt`、`stamina`）

## 【假設】

- MVP 使用 SQLite；`EMBEDDING_PROVIDER=openai` 可接 OpenAI Embedding，否則 mock。
- 危機／wellness 關鍵字攔截；資源訊息依使用者 `locale`（`GET /v1/meta/support-resources`）
- 生產環境建議 PostgreSQL + pgvector/Milvus。
- Offerwall：`OFFERWALL_SECRET` 啟用 HMAC 簽章與 `POST /v1/webhooks/offerwall`；未設定時為開發模擬發獎。
- 年齡：`AGE_GATE=1` 時需 `POST /v1/users/me/age-confirm`（出生年份，無證件）。
- LLM：`mock|openai|anthropic|hybrid|llama`；`hybrid` + `LLAMA_BASE_URL` 為輕量本地 + 商用 API；TTS：`openai|mock`。
- 部署見 `docs/DEPLOYMENT.md`（Docker Compose）。
- 藍圖完成度見 `docs/PRODUCT_STATUS.md`；Postgres 見 `docs/POSTGRES.md`。

## 商業參數（來自產品藍圖）

- 體力：文字 1、語音 3；進階模式消耗呼呼幣
- 訂閱：Lite $9.99 / Basic $19.99 / Premium $29.99（`GET /v1/pricing`、`GET /v1/meta/store-catalog` PPP 六區域）
