# 商店 IAP 上架檢查清單

Bundle ID：`com.ctrlz.huhu`。產品 ID 以 `packages/shared/src/iap-products.ts` 為準（API 透過 `@huhu/shared` 引用）。

## 環境（API）

| 項目 | 變數 | 說明 |
|------|------|------|
| 嚴格驗證 | `IAP_STRICT=true` | 未設定商店憑證時拒絕 IAP（禁止 dev stub） |
| Apple 舊版收據 | `APPLE_IAP_SHARED_SECRET` | `verifyReceipt`；sandbox 用 `APPLE_IAP_SANDBOX=1` |
| Apple Server API v2 | `APPLE_APP_STORE_*` | JWS `signedTransaction` 驗簽 |
| Google Play | `GOOGLE_PLAY_PACKAGE_NAME` + (`GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` **或** Secret File `google-play-sa.json` → `/etc/secrets/google-play-sa.json`) | Play Developer API |

## App Store Connect

- [x] 應用程式已建（App ID 6775517776）；版本 1.0 草稿
- [x] zh-TW 文案已填（App Store Connect 後台）
- [ ] 上傳 IPA（需 macOS：`pnpm build:ios` → `dist/ios-release/`）
- [x] 訂閱群組 `huhu_membership` 三檔已建；**群組 zh-TW 本地化**（顯示名「呼呼會員方案」）— 缺此項會導致三檔訂閱 Missing Metadata
- [x] 消耗型 small/medium/large Ready to Submit，已附 iOS 1.0
- [x] 訂閱 lite/basic/premium Ready to Submit，已附 iOS 1.0
- [x] 審核聯絡人／Notes 已填（**電話佔位 +886912345678 需更正**）
- [x] 營運對照表：`pnpm export:iap-store-checklist` → `dist/iap-store-checklist/`
- [ ] App 版本截圖（`dist/aso-screenshots/tw/` 或 `pnpm package:store-upload`）
- [ ] 各區域價格層級對齊 PPP（訂閱 availability 已設；消耗型已完成）
- [ ] 沙盒測試帳號驗證訂閱續期與到期降級
- [ ] Server Notifications（可選）對接續訂／退款

## Google Play Console

- [x] 建立應用程式 `com.ctrlz.huhu`（CTRL//Z 開發者帳號）
- [x] **Alpha 1.0.2 (3) 已發布**（封閉測試；`pnpm export:play-closed-test`）
- [x] release AAB 已上傳（`dist/android-release/com.ctrlz.huhu-release.aab`）
- [x] SKU 六檔已啟用（訂閱 lite/basic/premium + 幣包 small/medium/large，173 國）
- [ ] **12 名 opt-in 測試者 × 14 天**（目前 1/12）
- [x] 服務帳戶 JSON → Render Secret File（`pnpm export:play-api-setup`）
- [x] Play Console **邀請 SA 使用者**（Users 2 位；呼呼 Huhu 4 項應用程式權限）
- [x] `pnpm check:play-api` → `apiAccessOk=true`（Render `513942e`；probe=`oneTimeProducts`）
- [ ] 封閉測試驗證 `gp:<token>` 收據（Alpha 封測中；需 12 opt-in 測試者）

## 客戶端

- [x] Flutter `in_app_purchase` 商品 ID 與 `GET /v1/meta/iap-products` 同步（含「恢復購買」）
- [x] Web dev stub 訂閱／幣包 productId 自 `GET /v1/meta/iap-products` 載入
- [ ] 生產建置關閉 dev stub（`NODE_ENV=production` 且無 `MOCK_IAP`）
- [ ] Web 僅作開發 stub；正式付費以行動端商店為主

## 上架前檢查

- `GET /v1/meta/iap-readiness` — iOS/Android 驗證是否就緒（Android `configured` = Play API 完整；`packageName` 僅表示套件名已填）
- `GET /health` — 同上，嵌於 `iap` 欄位
- `pnpm check:iap` — CLI 檢查（需先 `pnpm build`；生產就緒時 exit 0）
- `pnpm check:launch` — 彙總 listings／catalog 驗證 + PPP 對照 + IAP 狀態（見下方）
- `pnpm export:aso-brief` — 寫入 `dist/aso-brief/*.md` 上架文案摘要（需六區 listing JSON）
- 截圖規格見 [docs/ASO_SCREENSHOTS.md](ASO_SCREENSHOTS.md)
- `pnpm package:store-upload` — 六市場 App Store + Google Play PNG + brief + catalog → `dist/store-upload/`

## 上架資料匯出

```bash
pnpm export:store-catalog          # 全部市場 JSON（stdout）
pnpm export:store-catalog:files   # 寫入 dist/store-catalog/*.json
pnpm validate:store-listings       # 確認六區 ASO listing JSON 齊全
pnpm validate:store-catalog        # 驗證六區 PPP + SKU + listing 結構
pnpm validate:dist-store-catalog   # 驗證 dist/store-catalog 匯出檔（需先 export:store-catalog:files）
node scripts/export-store-catalog.mjs tw
node scripts/export-store-catalog.mjs kr   # 韓國 KRW PPP
node scripts/export-store-catalog.mjs --out dist/store-catalog kr
```

或 `GET /v1/meta/store-catalog?market=tw`（含 PPP 與 SKU）。

## 驗收 API

```http
POST /v1/iap/verify
Authorization: Bearer <token>
{ "platform": "ios", "productId": "com.ctrlz.huhu.sub.lite", "receipt": "<store-receipt>" }
```

成功回傳 `economy` 與 `grant`；重複收據回 `409 receipt_already_redeemed`。

## 【假設】

- 訂閱週期 30 天由 API 內部計算，非直接讀取商店週期欄位。
- Offerwall 正式 SDK 尚未整合，見 `docs/DEPLOYMENT.md`。
