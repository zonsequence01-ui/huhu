# 呼呼 Huhu (`com.ctrlz.huhu`)

AI 陪伴平台 — TypeScript monorepo，含體力/虛擬貨幣經濟、RAG 長期記憶、雙層 LLM 路由（目前為 Mock，可接 OpenAI/Anthropic）。

## 結構

```
apps/api          Fastify REST API
packages/shared   常數、IAP SKU、PPP 定價、ASO 市場定義
packages/economy  體力、呼呼幣、訂閱權益
packages/ai       RAG、PII 清洗、安全檢測、LLM 路由
```

## 快速開始

```bash
pnpm install
pnpm build
pnpm dev
```

API 預設：`http://localhost:3000`

PostgreSQL（可選）：`DATABASE_URL=postgresql://huhu:huhu@localhost:5432/huhu`（見 `docs/POSTGRES.md`）

### 範例流程

```bash
# 建立訪客（回傳 JWT）
curl -X POST http://localhost:3000/v1/users/bootstrap

# 建立角色（替換 TOKEN）
curl -X POST http://localhost:3000/v1/characters \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"小呼","personality":"溫柔","backstory":"...","speakingStyle":"口語"}'

# 聊天
curl -X POST http://localhost:3000/v1/chat \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"characterId":"CHAR_ID","content":"你好","mode":"simple"}'
```

瀏覽器開啟 http://localhost:3000 可使用內建 Web UI（含好感度儀表板、角色創建、每日簽到、Offerwall 模擬）。

生產部署見 [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)。上架清單見 [docs/LAUNCH.md](docs/LAUNCH.md)。完成度見 [docs/PRODUCT_STATUS.md](docs/PRODUCT_STATUS.md)。專案外阻斷見 [docs/BLOCKERS.md](docs/BLOCKERS.md)。ASO 見 [docs/ASO_SCREENSHOTS.md](docs/ASO_SCREENSHOTS.md)。安全見 [docs/SAFETY.md](docs/SAFETY.md)。

## 測試

```bash
pnpm prelaunch               # verify + E2E（上架前）
pnpm verify                  # build/test/smoke/check:launch
pnpm build && pnpm typecheck && pnpm lint
pnpm test                    # 單元（shared / economy / ai / api）
pnpm test:integration        # API 整合（含 app.integration.test.ts；SQLite + 可選 Postgres job）
pnpm test:e2e                # Playwright E2E（43 tests）
pnpm export:store-catalog   # 需先 pnpm build；匯出 ASO + PPP + SKU JSON
pnpm export:store-catalog:files   # 寫入 dist/store-catalog/*.json（gitignore）
pnpm validate:store-listings   # 六市場 JSON + App Store 欄位長度
pnpm validate:store-catalog
pnpm validate:dist-store-catalog  # 需先 export:store-catalog:files
pnpm check:iap                # 商店憑證就緒檢查（生產前；無憑證時 exit 1 屬預期）
pnpm check:launch             # 上架前：listings + catalog + PPP + IAP 報告
pnpm export:aso-brief         # 六區 ASO 文案摘要 → dist/aso-brief/
pnpm capture:aso-screenshots  # 六張商店截圖 → dist/aso-screenshots/
pnpm validate:aso-screenshots:all # 驗證六市場 App Store PNG
pnpm resize:aso-play-screenshots -- --all  # Google Play 1080×1920
pnpm validate:aso-play-screenshots:all
pnpm compose:aso-screenshots -- --all  # 疊加 screenshotCaptions → *-captioned/
pnpm validate:aso-captioned:all     # 驗證 captioned PNG 尺寸
pnpm package:store-upload       # 六市場 raw + captioned + brief + catalog
pnpm validate:store-upload      # 驗證 dist/store-upload 結構
pnpm export:iap-store-checklist # IAP SKU + PPP → dist/iap-store-checklist/
pnpm validate:iap-store-checklist
pnpm package:launch-bundle      # 上架文件包 → dist/launch-bundle/
pnpm validate:launch-bundle     # 驗證 launch-bundle 結構
pnpm export:operations-status  # 營運狀態摘要 → dist/OPERATIONS_STATUS.md
pnpm smoke:api:local           # 公開 API 煙測（自啟暫存 API）
pnpm smoke:api                 # 對已運行 API（SMOKE_BASE_URL，預設 :3000）
```

`dist/store-catalog/` 為建置產物，不納入版控；CI 於 `export:store-catalog:files` 後執行 `validate:dist-store-catalog`。

## 環境變數

見 `.env.example`。

## Flutter 行動端

```bash
cd apps/mobile
flutter pub get
# Android 模擬器連本機 API
flutter run --dart-define=API_BASE=http://10.0.2.2:3000
```

Bundle ID：`com.ctrlz.huhu`

## 路線圖

- [x] Flutter 客戶端（MVP 聊天）
- [x] IAP 收據驗證 stub、PPP 定價 API
- [x] 對話匯出（Web Novel Markdown）
- [x] 角色一致性防護、記憶自動摘要
- [x] Anthropic / OpenAI LLM 路由（`LLM_PROVIDER=anthropic|openai`）
- [x] OpenAI Embedding 選項（`EMBEDDING_PROVIDER=openai`）
- [x] 最近對話上下文 + OpenAI TTS（`TTS_PROVIDER=openai`）
- [x] 每日簽到、Docker Compose、Flutter 隱私管理
- [x] 訂閱到期自動降級、Web/Flutter 語音模式與播放
- [x] pgvector（可選 `PGVECTOR_URL`）；Milvus 尚未整合
- [ ] App Store / Play 正式收據驗證與商店商品上架

## 免責聲明

本專案為技術實作，不構成醫療或心理治療建議。危機情境請尋求專業協助。
