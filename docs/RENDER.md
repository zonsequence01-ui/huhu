# Render 部署（huhu-api）

## 現況

| 項目 | 值 |
|------|-----|
| API | `https://huhu-api.onrender.com` |
| Service ID | `srv-d8jaq8uk1jcs73f59mig`（Dashboard → Environment） |
| Blueprint | `huhu`（`render.yaml`） |
| GitHub | `https://github.com/zonsequence01-ui/huhu` |
| Pages 代理 | `https://huhu-app.pages.dev` → `API_ORIGIN` |
| 資料庫 | **Neon Postgres**（`DATABASE_URL` 於 Dashboard 設定；Blueprint `sync: false` 防覆寫） |
| 向量庫 | pgvector（與 `DATABASE_URL` 同庫） |
| 限速 | `RATE_LIMIT_BACKEND=postgres` |

驗證：

```bash
pnpm check:render
pnpm check:play-api          # OAuth + Play Console Grant access（部署後）
CHECK_SITE_REQUIRE_HEALTH=1 pnpm check:site
pnpm smoke:api:prod
```

`/health` 預期：`database: postgres`、`vectorStore: pgvector`、`rateLimit.backend: db`。

## Free tier 限制

- **冷啟動**：閒置 ~15 分鐘後首請求可能需 30–90 秒；App 已對 bootstrap 做重試。
- **無 Shell**（Free）：除錯依 Render Logs 與本機 `pnpm check:render`。

## 環境變數（Dashboard）

| 變數 | 說明 |
|------|------|
| `DATABASE_URL` | Neon `postgresql://...`（**勿**設 `file:`） |
| `JWT_SECRET` | 必填；未設則 API 拒絕啟動 |
| `RATE_LIMIT_BACKEND` | 建議 `postgres` |
| `LLM_PROVIDER` | 預設 `mock`；生產可改 `hybrid` + 商用 API |
| `VECTOR_STORE` | 未設且 Postgres 時自動 pgvector |

`render.yaml` 中 `DATABASE_URL`、`RATE_LIMIT_BACKEND` 為 `sync: false`，避免 Blueprint 覆寫為 SQLite。

## IAP（Google Play）

| 方式 | 設定 |
|------|------|
| Secret File（推薦） | 上傳 `google-play-sa.json` → API 自動讀 `/etc/secrets/google-play-sa.json` |
| 環境變數 | `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` 或 `GOOGLE_PLAY_SERVICE_ACCOUNT_PATH` |
| 嚴格模式 | `IAP_STRICT=true`（需 iOS + Play API 憑證齊全） |

`GET /v1/meta/play-api-probe` — 驗證 SA OAuth 與 Play Console **Grant access**（`apiAccessOk`）。

詳見 `pnpm export:play-api-setup` → `dist/play-api-setup/README.md`。

## Schema 衝突

Neon 若含舊表結構，部署可能 FK 失敗。見 `docs/POSTGRES.md` → `pnpm reset:neon-schema`（**會清空 public schema**）。

## 推送程式碼

```bash
# Windows：PAT 需含 repo + workflow scope
set GITHUB_TOKEN=ghp_...
pnpm push:github
# 或含 CI workflow 推送
pnpm push:ci
```

Push 到 `main` 後 GitHub Actions 跑完整 CI（node / postgres / flutter / docker-smoke）。

## 更新 Pages API 指向

```bash
pnpm set:pages-api-origin -- https://huhu-api.onrender.com
pnpm deploy:pages
```
