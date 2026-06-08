# 部署指南

## Docker（建議）

```bash
cp .env.example .env
# 編輯 JWT_SECRET（必填，不可留 change-me-in-production）、OPENAI_API_KEY 等

docker compose up --build -d
```

生產主機（強制 `JWT_SECRET`、可選 Caddy TLS）：

```bash
pnpm export:deploy-bundle && pnpm validate:deploy-bundle
```

**Phase 1（商店隱私權 URL）** — Cloudflare Pages（你的帳戶，無需自備網域）：

```bash
export CLOUDFLARE_API_TOKEN=...   # CF → API Tokens → Edit Cloudflare Workers
pnpm deploy:pages
curl -sI https://huhu-app.pages.dev/privacy.html
```

或 VPS 僅靜態頁：

```bash
cp infra/Caddyfile.static.example infra/Caddyfile.static
docker compose -f docker-compose.static.yml up -d
curl -sI https://YOUR_DOMAIN/privacy.html
```

**Phase 2（完整 API）** — 三種路徑擇一：

**A. Render（最快，免 VPS）**

```bash
# render.com → New Blueprint → 連 repo → render.yaml
# 部署後取得 https://huhu-api.onrender.com
pnpm deploy:pages
pnpm set:pages-api-origin -- https://huhu-api.onrender.com
CHECK_SITE_REQUIRE_HEALTH=1 pnpm check:site
pnpm smoke:api:prod
```

**B. VPS + Docker + Caddy**

```bash
pnpm generate:jwt-secret
cp infra/Caddyfile.example infra/Caddyfile   # 設定網域後
docker compose -f docker-compose.prod.yml --profile tls up --build -d
# Pages API_ORIGIN = https://你的 API 網域
```

**C. 本機暫時堆疊（開發機當 API + trycloudflare 隧道）**

Windows／macOS Docker Desktop 適用；Pages 仍代理至隧道 URL：

```bash
pnpm start:prod-stack              # Docker API + cloudflared 隧道
pnpm start:prod-stack -- --sync-pages   # 並寫入 Pages API_ORIGIN
pnpm health:prod-stack             # 本機 API + 隧道 + Pages /health
```

狀態檔：`dist/prod-stack-state.json`。**P0 風險**：隧道 URL 會變、程序需常駐；正式環境請用 A 或 B。

**D. 同域直連（自管網域指向 API 容器，不用 Pages 代理）**

```bash
pnpm export:deploy-bundle && pnpm validate:deploy-bundle
# 上傳 dist/deploy-bundle/ → bash deploy-remote.example.sh
```

DNS：`ctrlz.dev` **非本專案擁有**；正式 URL 使用 **Cloudflare Pages**（預設 `https://huhu-app.pages.dev`）。自備網域時在 CF 或 VPS 設定即可。

`NODE_ENV=production` 且 `JWT_SECRET` 仍為預設值時，API 會拒絕啟動。`/health` 回傳 `security.jwtSecretConfigured` 與 `deployment.storePublicSiteUrl`。

映像檔內含 `apps/web`（`/support.html`、`/privacy.html`、聊天 Web UI）。部署後驗證：

```bash
pnpm verify:docker          # 建置映像並在容器內跑 smoke
SMOKE_BASE_URL=http://localhost:3000 pnpm smoke:api
pnpm smoke:api:prod         # 對 STORE_PUBLIC_SITE_URL（預設 https://huhu-app.pages.dev）
```

- API：`http://localhost:3000`
- 健康檢查：`GET /health`
- 客戶端公開設定（建議）：`GET /v1/meta/client-config?locale=zh-TW`
- 部署後煙測：`pnpm smoke:api`（`SMOKE_BASE_URL` 指向生產 URL）；本機自測：`pnpm smoke:api:local`（自動選可用埠，勿固定佔用舊進程）
- 動態覆核（需 `ADMIN_API_KEY`）：`http://localhost:3000/admin.html`
- ASO 文案預覽：`http://localhost:3000/aso.html`
- 商店支援／隱私靜態頁：`/support.html`、`/privacy.html`（正式網域見 `STORE_PUBLIC_SITE_URL`，預設 `https://huhu-app.pages.dev`）
- 語系列表：`GET /v1/meta/locales`
- 資料持久化：volume `huhu-data`
- 可選 Postgres：`docker compose --profile postgres up -d`（見 `docs/POSTGRES.md`）
- 可選本地 Llama（Ollama）：`docker compose --profile llama up -d`，於 host 執行 `ollama pull llama3`，API 設定 `LLM_PROVIDER=hybrid` 與 `LLAMA_BASE_URL=http://127.0.0.1:11434/v1`

## 本機開發

```bash
pnpm install
pnpm build
pnpm --filter @huhu/api dev
```

Web 靜態檔由 API 在開發模式掛載 `apps/web`；生產可改由 CDN 提供。

## Apple 根憑證（IAP JWS）

內建 `apps/api/certs/apple-root-ca-g2.pem` 與 `apple-root-ca-g3.pem`。更新：

```bash
node scripts/fetch-apple-root-certs.mjs
```

## 環境變數

| 變數 | 說明 |
|------|------|
| `JWT_SECRET` | 生產必填 |
| `LLM_PROVIDER` | `mock` / `openai` / `anthropic` / `hybrid` / `llama` |
| `EMBEDDING_PROVIDER` | `mock` / `openai` |
| `TTS_PROVIDER` | `mock`（開發）/ `openai`（需 `OPENAI_API_KEY`） |
| `OPENAI_API_KEY` | OpenAI 對話、嵌入、TTS、Whisper STT、Vision 照片描述 |
| `OPENAI_VISION_MODEL` | 可選，預設 `gpt-4o-mini` |
| `ANTHROPIC_API_KEY` | Claude 深度對話 |
| `LLAMA_BASE_URL` | 本地 Llama OpenAI 相容端點（如 `http://llama:8080/v1`） |
| `HYBRID_COMMERCIAL_PROVIDER` | `openai` 或 `anthropic`（hybrid 深度模式） |
| `MOMENT_REPORT_HIDE_THRESHOLD` | 公開動態自動隱藏所需獨立檢舉數（預設 `3`） |
| `ADMIN_API_KEY` | 營運覆核：`x-admin-key` 存取 `/v1/admin/moments/*`（未設定則 503） |
| `IAP_STRICT` | 設為 `true` 時，未設定商店憑證則拒絕 IAP（禁止 dev stub） |
| `PUBLIC_WEB_URL` | 好友邀請連結基底（如 `https://app.example.com`），寫入 `/v1/users/me` 的 `inviteLink` |
| `STORE_PUBLIC_SITE_URL` | 商店 Support/Privacy 連結基底（無尾隨斜線）；`GET /v1/meta/client-config` 的 `storeUrls` 與 `dist/app-store-connect/urls.json` 預設值 |
| `FRIEND_REQUEST_RATE_LIMIT` | 每使用者每小時好友請求上限（預設 `30`） |
| `USER_SEARCH_RATE_LIMIT` | 每使用者每小時好友搜尋上限（預設 `60`） |
| `RATE_LIMIT_BACKEND` | `db` 或 `postgres`：速率限制寫入 `rate_limit_buckets`（多實例）；預設記憶體 |

### Hybrid 雙層路由（藍圖）

```bash
LLM_PROVIDER=hybrid
LLAMA_BASE_URL=http://127.0.0.1:8080/v1
HYBRID_COMMERCIAL_PROVIDER=openai
OPENAI_API_KEY=sk-...
```

- `simple` 模式與日常閒聊 → 輕量 Llama（`LLAMA_BASE_URL`）
- `long` / `exciting` → 商用 API（OpenAI 或 Anthropic）
- 未設定 `LLAMA_BASE_URL` 時 hybrid 會退回商用 API

### 隱私與商用 API（藍圖）

- 對話送交 OpenAI／Anthropic 前，後端以 `@huhu/ai` PII scrub（NER 風格）遮蔽姓名、聯絡方式等；RAG 索引與檢索亦會清洗。
- 生產商用 API 應簽署企業合約並啟用 **Zero Data Retention（ZDR）**，禁止供應商將使用者對話用於模型訓練。
- 聊天紀錄於應用 DB 以營運所需保存；非端對端加密——上架文案與隱私政策須如實說明。

## 【假設】生產擴展

- SQLite 僅適合 MVP；高流量請遷移 PostgreSQL + pgvector。
- 雙層 LLM 本地推論（Llama）需另建 GPU 節點，本 repo 尚未包含。
- iOS：設定 `APPLE_IAP_SHARED_SECRET` 或 App Store Server JWS 憑證；Android 設定 `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`。
- Flutter：`in_app_purchase` 於設定頁訂閱；商店不可用時自動退回 `dev_stub`（非 production 或 `MOCK_IAP=1`）。
- 行動端產品 ID 見 `GET /v1/meta/iap-products` 與 `packages/shared/src/iap-products.ts`。
- CI：`postgres` job 以 `TEST_DATABASE_URL` 執行 Postgres 整合測試。

## 商店目錄（ASO / PPP / SKU）

建置後匯出六區定價與 ASO 文案：

```bash
pnpm build
pnpm export:store-catalog          # stdout JSON
pnpm export:store-catalog:files   # 寫入 dist/store-catalog/*.json
pnpm validate:store-listings      # 檢查 apps/api/src/data/store-listings
pnpm validate:store-catalog       # 檢查 PPP 與 SKU 一致性
```

上傳 App Store Connect / Play Console 前，以 `dist/store-catalog` 對照各區 Price Tier。
