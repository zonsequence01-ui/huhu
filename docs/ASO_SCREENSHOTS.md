# ASO 截圖素材規格

上架前依各商店後台要求匯出 PNG。文案與順序以 `apps/api/src/data/store-listings/*.json` 的 `screenshotCaptions` 為準；預覽見 Web `/aso.html`。

## 建議順序（6 張）

1. 聊天與好感度儀表板  
2. 三種對話模式  
3. 角色建立  
4. 日記與動態  
5. 訂閱與 PPP 定價  
6. 隱私與資料刪除  

## 尺寸參考

| 平台 | 裝置／格式 | 像素（寬 × 高） |
|------|------------|-----------------|
| App Store | iPhone 6.7" (ASC) | 1284 × 2778 |
| Google Play | 手機 | 1080 × 1920 起（最短邊 ≥1080） |

## 製作方式

1. 本機 `pnpm dev` 啟動 API + Web，或讓擷圖腳本自行啟動測試伺服器。  
2. 執行 `pnpm capture:aso-screenshots`（單一 `tw`）或 `pnpm capture:aso-screenshots -- --all`（六市場）。  
3. 產出 `dist/aso-screenshots/{market}/01-chat.png` … `06-privacy.png`。  
4. 驗證：`pnpm validate:aso-screenshots:all`；App Store 上傳尺寸 `pnpm resize:aso-app-store-screenshots -- --all` → `dist/asc-iphone69/`（1284×2778）。  
5. Google Play 尺寸：`pnpm resize:aso-play-screenshots -- --all` → `dist/aso-screenshots-play/`；驗證 `pnpm validate:aso-play-screenshots:all`。  
6. 標題疊加：`pnpm compose:aso-screenshots -- --all` → `dist/aso-screenshots-captioned/`、`dist/aso-screenshots-play-captioned/`（讀取 listing 的 `screenshotCaptions`）。  
7. 一鍵打包：`pnpm package:store-upload` → 含 raw 與 `*-captioned/` 子資料夾 + brief + catalog JSON（若缺 captioned 會自動執行 compose）。  
8. 上傳至 App Store Connect / Play Console：建議使用 `app-store-captioned/`、`google-play-captioned/`。

## 檢查

- `pnpm validate:store-listings` — 六市場 listing 與 captions 完整  
- `pnpm export:store-catalog` — 匯出含 PPP 的目錄 JSON 供營運對照  
- `pnpm export:aso-brief` — 六區 Markdown 上架摘要 → `dist/aso-brief/`  
- `pnpm capture:aso-screenshots` — Web UI 六張截圖 → `dist/aso-screenshots/`  
- `pnpm validate:aso-screenshots:all` — App Store PNG 已產出  
- `pnpm resize:aso-play-screenshots -- --all` — Google Play 1080×1920  
- `pnpm validate:aso-play-screenshots:all` — Play PNG 尺寸驗證  
- `pnpm compose:aso-screenshots -- --all` — 疊加各市場截圖標題  
- `pnpm validate:aso-captioned:all` — 驗證 captioned PNG 尺寸  
- `pnpm package:store-upload` — 六市場上架素材資料夾  
- `pnpm export:iap-store-checklist` — 各商店 IAP SKU／PPP 對照 → `dist/iap-store-checklist/`  
- `pnpm validate:store-upload` — 驗證 bundle 結構與 PNG 尺寸  
- `pnpm check:launch` — 彙總 listings／catalog／PPP／IAP 狀態
