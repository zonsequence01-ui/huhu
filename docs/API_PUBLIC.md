# 公開 API（無需 JWT）

Base URL 預設 `http://localhost:3000`。完整路由見 `apps/api/src/app.ts`。

## 健康與設定

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/health` | 狀態、bundleId、`publicMeta` 路徑索引、economy 摘要、DB/LLM 驅動、`security.jwtSecretConfigured`、`deployment.storePublicSiteUrl` |
| GET | `/v1/meta/client-config?locale=` | **建議**：economy + offerwall + supportResources + `storeUrls`（support/privacy 靜態頁）+ `subscriptionTiers`（`tierDisplayName`、`entitlementsLabel`）+ `subscriptionTiersPrompt` + `apiErrors`（常見錯誤碼在地化文案）一次載入 |
| GET | `/v1/meta/economy` | 體力／呼呼幣規則 |
| GET | `/v1/meta/offerwall` | Offerwall 整合模式與端點 |
| GET | `/v1/meta/support-resources?locale=` | 隱私提醒、危機資源 |
| GET | `/v1/meta/locales` | 支援語系 |
| GET | `/v1/meta/ui-strings?locale=` | 客戶端 UI 文案 |
| GET | `/v1/meta/iap-products` | SKU 列表 |
| GET | `/v1/meta/iap-readiness` | 商店憑證就緒度 |
| GET | `/v1/meta/store-catalog?market=` | PPP 目錄與建議價 |
| GET | `/v1/meta/store-listings` | ASO 文案 JSON 索引 |
| GET | `/v1/meta/default-character?locale=` | 預設角色 preset |

## Webhook

| 方法 | 路徑 | 說明 |
|------|------|------|
| POST | `/v1/webhooks/offerwall` | 廣告聯播網 HMAC 回調（見 `docs/OFFERWALL.md`） |

## 靜態頁（無 JWT）

| 路徑 | 說明 |
|------|------|
| GET | `/support` | 支援與危機資源（App Store Support URL） |
| GET | `/privacy` | 隱私權說明（商店政策連結） |
| GET | `/support.html` | 同上（相容路徑） |
| GET | `/privacy.html` | 同上（相容路徑） |

## 驗證

```bash
pnpm smoke:api:local   # 自啟 API（建議）
pnpm verify:docker     # Docker 映像含 apps/web 靜態頁
pnpm smoke:api:prod    # 正式網域 STORE_PUBLIC_SITE_URL
pnpm dev               # 另開終端後 pnpm smoke:api
```

`pnpm prelaunch` = `pnpm verify` + E2E，為上架前完整閘門。

## 開發用（非 production）

| 方法 | 路徑 | 說明 |
|------|------|------|
| PATCH | `/v1/users/me/dev-economy` | 測試／E2E 調整 `stamina`、`coins`（需 JWT；production 回 403；空 body 回 `validation_failed`） |
