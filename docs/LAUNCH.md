# 全球上架執行清單

Bundle ID：`com.ctrlz.huhu`。程式碼就緒度以 `pnpm check:launch` 為準。

## 一、程式碼內可自動驗證

```bash
pnpm prelaunch                 # verify + E2E（上架前建議全跑）
pnpm verify                    # build + lint + typecheck + test + smoke + check:launch
pnpm build
pnpm test && pnpm test:integration && pnpm test:e2e
pnpm check:launch
pnpm export:iap-store-checklist && pnpm validate:iap-store-checklist
pnpm package:store-upload && pnpm validate:store-upload
pnpm export:app-store-connect   # includes Support/Privacy URLs in urls.json
pnpm validate:public-pages
pnpm validate:ios-config
pnpm package:ios-release
pnpm package:launch-bundle
pnpm validate:launch-bundle   # 含 LAUNCH/OPERATIONS_STATUS 須含 prelaunch 指令
pnpm export:operations-status   # dist/OPERATIONS_STATUS.md（IAP + 產物摘要）
```

公開 Meta API 見 [API_PUBLIC.md](API_PUBLIC.md)。煙測：`pnpm smoke:api:local`（自啟 API）；或 `pnpm smoke:api`（`SMOKE_BASE_URL` 指向已運行實例）。

通過後產物：

| 路徑 | 用途 |
|------|------|
| `dist/launch-bundle/` | 上架文件副本 + `OPERATIONS_STATUS.md` + manifest（指向 dist 大檔） |
| `dist/store-upload/{market}/` | 截圖（raw + captioned）、ASO brief、catalog、IAP checklist |
| `dist/iap-store-checklist/` | 六市場 SKU + PPP 對照 |
| `dist/aso-brief/` | 商店文案摘要 |

## 二、App Store Connect / Google Play（人工）

1. 依 `dist/iap-store-checklist/{market}.md` 建立訂閱與消耗型 SKU（見 `docs/STORE_IAP.md`）。
2. 各區域價格層級對齊 `dist/store-catalog/{market}.json` 的 PPP。
3. 上傳 `app-store-captioned/` 或 `google-play-captioned/` 六張截圖。
4. 貼上 `dist/aso-brief/{market}.md` 中的標題、副標題、關鍵字、描述。
5. 沙盒帳號驗證訂閱與呼呼幣包；設定 `IAP_STRICT` 與 Apple/Google 憑證後執行 `pnpm check:iap`。

## 三、生產 API（人工）

```bash
pnpm export:deploy-bundle && pnpm validate:deploy-bundle
pnpm generate:jwt-secret    # 寫入 .env 的 JWT_SECRET
# 上傳 dist/deploy-bundle/ 至雲端主機後：
docker compose -f docker-compose.prod.yml --profile tls up --build -d
pnpm smoke:api:prod
```

見 `docs/DEPLOYMENT.md`：`JWT_SECRET`、`LLM_PROVIDER`（建議 `hybrid` + `LLAMA_BASE_URL`）、`DATABASE_URL`、可選 `PGVECTOR_URL`、`OFFERWALL_SECRET`。

## 四、仍待整合（藍圖）

- 正式 Offerwall SDK（後端 HMAC webhook 已就緒，見 `docs/OFFERWALL.md`）
- 全球負載均衡與 GPU 推論節點
