# 產品完成度對照（藍圖 vs 現況）

最後更新：開發中 MVP。藍圖為需求來源，實作以程式碼為準。

## 已完成（MVP）

| 領域 | 項目 |
|------|------|
| 核心 | JWT 訪客、角色 CRUD、聊天三模式、好感度／關係階段 |
| 記憶 | SQLite RAG、mock/OpenAI 嵌入、每 20 則摘要、最近 12 則上下文 |
| 安全 | 危機／wellness 攔截（zh/en/ja/ko/vi、依使用者語系）、安全訊息持久化+歷史氣泡、PII scrub（LLM + RAG 索引／檢索 + web novel 匯出使用者行）、多語系角色崩壞防護（`guardCharacterReply`、修正標記持久化）、`GET /v1/meta/support-resources`、Web/Flutter 支援資源入口 |
| 經濟 | 體力 50／10 分鐘恢復、呼呼幣、Offerwall HMAC／每日簽到 |
| 合規 | 18+ 出生年份確認（無證件上傳）、聊天前強制驗證；Web/Flutter 可關閉聊天隱私提示（`privacyReminder`）；商店 Support/Privacy 靜態頁 + `client-config.storeUrls` + `dist/app-store-connect/urls.json`；Web/Flutter 支援／隱私對話框可開啟 `storeUrls.support`／`privacy` |
| LLM 路由 | `LLM_PROVIDER=hybrid` + `LLAMA_BASE_URL` 雙層（輕量本地／商用 API） |
| 訂閱 | Lite/Basic/Premium 權益（Lite+ 免體力、Basic+ 語音、進階模式仍耗幣）、IAP stub、30 天到期降級、每月贈幣（曆月首次同步）；Web/Flutter 訂閱方案與語音按鈕 tooltip 依語系與 client-config 顯示在地化方案名（非硬編碼 Lite/Basic+） |
| 向量庫 | SQLite 預設；可選 `PGVECTOR_URL` + pgvector |
| E2E | Playwright `pnpm test:e2e`（63 項；含年齡門檻、`rate_limited` 好友邀請 API+Web、好友搜尋限速、`validation_failed` client-config+Web 角色建立、Web 體力／幣／角色上限／空訊息／無效 `characterId` 恢復錯誤在地化、ja/vi client-config apiErrors 等）；**全部** Web UI 測試共用 `e2e/helpers/web-session.ts`（`addInitScript` 避免 bootstrap token 競態、`waitForWebReady` 等待 session 完成） |
| 營運 | `pnpm prelaunch`（verify+E2E）、`pnpm verify`、`validate:operations-status`、`smoke:api:local`（動態埠）、`docs/BLOCKERS.md` |
| 定價 | PPP API（US/JP/TW/VN/KR/CN）、`store-catalog`（訂閱+呼呼幣包建議價）、`localeToStoreMarket`（shared）、`pnpm validate:store-listings`、`pnpm validate:store-catalog`、`pnpm validate:dist-store-catalog`（`dist/` 建置產物） |
| 隱私 | 關係重置、RAG 列表／單筆刪除／全部清除、刪除帳號 API+Web/Flutter；清除對話、單則刪除；Web/Flutter 隱私頁記憶片段列表；`POST /v1/chat` 回傳 `userMessageId`／`reply.id` |
| 客戶端 | Release 建置預設 API `https://huhu-app.pages.dev`（`api_config.dart` + `--dart-define=API_BASE`）；Web／Flutter 角色切換、經濟規則與模式消耗提示、`GET /v1/meta/client-config` 單次載入（含 `subscriptionTiers` + `tierDisplayName` + `subscriptionTiersPrompt`）、`GET /v1/users/me` 回傳 `subscriptionTierDisplayName`、訂閱+幣包 PPP、訂閱對話框／狀態列／設定頁方案與權益摘要皆**在地化**（含免費 `tierNameFree`）、9 個 API 錯誤碼於 **zh-TW／zh-CN／en／ja-JP／ko-KR／vi-VN** 完整在地化；`client-config.apiErrors` 與 `@huhu/shared` `formatApiErrorMessage` 同步（BCP-47 正規化）、Web 無效 `characterId` 自動恢復（`recoverMissingCharacter`）、訂閱／隱私 dialog、好友 QR／封鎖、安全／角色修正氣泡；Web/Flutter 無 body 請求不帶 JSON Content-Type；API `onRequest` 亦會剝除空 body 的 JSON Content-Type |
| 部署 | Dockerfile、docker-compose、`docker-compose.prod.yml` + Caddy TLS 範例、`pnpm export:deploy-bundle`、`pnpm verify:docker`、生產 `JWT_SECRET` 啟動防護、`/health` 部署欄位 |
| Postgres | `DATABASE_URL=postgresql://...` 切換應用表 + health 回報 driver；**生產** Render→Neon 已驗證（`database: postgres`、`vectorStore: pgvector`） |
| UI i18n | `GET /v1/meta/ui-strings`、Web/Flutter 設定與角色建立 |
| IAP | Apple `verifyReceipt`、Google Play API scaffold、收據冪等；Flutter `in_app_purchase` + 恢復購買 |
| 遷移 | `scripts/migrate-sqlite-to-postgres.mjs`、CI Postgres job |

## 進行中／部分完成

| 項目 | 現況 | 缺口 |
|------|------|------|
| 語音 | TTS + STT；Web 按住錄音、Flutter 長按錄音 | — |
| 照片 | API + Vision（可選）；Web／Flutter 上傳 | — |
| 日記 | CRUD + RAG；Web 對話框、Flutter 表單 | — |
| 動態 | 公開／好友／私人 visibility；邀請碼／連結／QR、封鎖、暱稱搜尋 API+Web/Flutter；`/admin.html` 營運頁 | — |
| 多語系 | 預設角色依 locale、`zh-CN` ASO+CNY PPP、`vi-VN` 完整 UI；`localeHint` + `relationshipStageBehavior` + `stageLabelForLocale`（API/UI 關係標籤） | 需生產級模型微調／GPU |
| ASO | 同上 + `compose:aso-screenshots`（標題疊加）+ `validate:store-upload`（含 captioned 子資料夾）；`pnpm check:launch` | 手動上傳 `dist/store-upload/*`（建議 `*-captioned/`） |
| IAP 營運 | Play 六檔 SKU + 內測 1.0.0 + **tw listing 已可送審**（icon + feature + 6 手機）；隱私 URL `https://huhu-app.pages.dev/privacy`；ASC 消耗型+訂閱 **Ready + 已附 iOS 1.0**；**App 截圖 6/6**、年齡 18+、Subtitle、Entertainment、**App Privacy 問卷已 Publish** | IPA（macOS）、IAP API 憑證、Play **送審按鈕仍 disabled**（控管型發布無法開啟）、ASC App Privacy URL Save（Apple 非同步驗證） |
| LLM | mock/openai/anthropic/hybrid；compose `llama` profile（Ollama） | 生產 GPU 節點 |
| IAP | Play API、JWS、冪等；`GET /v1/meta/iap-readiness`；Flutter/Web 自 `iap-products` 同步 SKU；Flutter 恢復購買；Web dev stub；`docs/STORE_IAP.md` | 生產商店憑證全開、App Store Connect / Play Console 商品上架 |
| Offerwall | HMAC + `OFFERWALL_ALLOWED_IPS` webhook；`GET /v1/meta/offerwall`；Web／Flutter 聊天與設定頁領幣 | 正式 SDK |

## 未開始（藍圖）
- 全球負載均衡、GPU 推論節點
- 正式 Apple/Google Offerwall SDK 整合

## 【假設】

- 本機／測試預設 SQLite；生產可改 `DATABASE_URL` 見 `docs/POSTGRES.md`。
- NSFW 僅 Premium 提示詞層，無獨立審核管線。
