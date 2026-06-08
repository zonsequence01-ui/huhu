# Render 部署（huhu-api）

## 現況

| 項目 | 值 |
|------|-----|
| API | `https://huhu-api.onrender.com` |
| Blueprint | `huhu`（`render.yaml`） |
| GitHub | `https://github.com/zonsequence01-ui/huhu` |
| Pages 代理 | `https://huhu-app.pages.dev` → `API_ORIGIN` |

驗證：

```bash
pnpm check:render
CHECK_SITE_REQUIRE_HEALTH=1 pnpm check:site
pnpm smoke:api:prod
```

## Free tier 限制

- **無 persistent disk**：`DATABASE_URL=file:/app/data/huhu.db` 在容器重啟後清空。
- **冷啟動**：閒置 ~15 分鐘後首請求可能需 30–90 秒；App 已對 bootstrap 做重試。

## 持久化（建議）

1. 建立 [Neon](https://neon.tech) 或 Render Postgres 免費／付費實例。
2. Render Dashboard → **huhu-api** → Environment → 設定：
   - `DATABASE_URL=postgresql://...`
   - （可選）`PGVECTOR_URL=postgresql://...`
   - （可選）`RATE_LIMIT_BACKEND=postgres`
3. Manual Deploy 或 push 觸發 Blueprint sync。

## 推送程式碼

```bash
# Windows：清除錯誤的 gh 憑證後
set GITHUB_TOKEN=ghp_...
pnpm push:github
```

CI workflow 需 PAT 含 `workflow` scope；或使用 GitHub Actions 自動跑（push 到 main 後）。

## 更新 Pages API 指向

```bash
pnpm set:pages-api-origin -- https://huhu-api.onrender.com
pnpm deploy:pages
```
