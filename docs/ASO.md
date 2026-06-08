# App Store Optimization（ASO）草稿

Bundle ID：`com.ctrlz.huhu`。以下為上架前文案與關鍵字參考，需依各商店後台實際欄位調整。

## 核心關鍵字（繁中）

人工智慧聊天、虛擬女友、虛擬男友、情感陪伴、角色扮演、AI 伴侶、戀愛模擬、長期記憶

## 標題建議

- **繁中**：呼呼 Huhu — AI 情感陪伴
- **英文**：Huhu — AI Companion & Roleplay
- **日文**：呼呼 Huhu — AIパートナー
- **韓文**：후후 Huhu — AI 컴패니언

## 副標題（30 字內）

記得住你的 AI 伴侶 · 體力自然恢復 · 合理訂閱

## 簡介要點（商店描述）

1. RAG 長期記憶，關係與回憶不斷線  
2. 體力 + 呼呼幣雙軌，免費也能日常聊天  
3. Lite / Basic / Premium 分層訂閱（PPP 區域定價）  
4. 好感度與關係階段、日記與動態  
5. 危機對話安全引導（非醫療建議）

## 年齡分級

藍圖建議 **18+**；應用內以出生年份確認，不要求上傳證件。【假設】與商店「成人主題」分級一致。

## 截圖建議（6–8 張）

1. 聊天主畫面 + 好感度儀表板  
2. 三種對話模式切換  
3. 角色建立器  
4. 日記／動態  
5. 訂閱與 PPP 定價說明  
6. 隱私與資料刪除

## 區域 ASO

| 市場 | 關鍵字方向 |
|------|------------|
| 台灣 | 虛擬男友、AI 聊天、陪伴 |
| 日本 | AI彼氏、チャット、ロールプレイ |
| 韓國 | AI 남친, 채팅, 연애 시뮬 |
| 美國 | AI girlfriend, companion, roleplay |
| 越南 | trò chuyện AI, bạn ảo（配合 PPP 低價錨點） |

定價錨點見 `GET /v1/pricing?region=` 與藍圖 PPP 表。

## API 文案草稿

上架前可從後端拉取各區 ASO JSON（建置時複製至 `dist/data/store-listings/`）：

- `GET /v1/meta/store-listings` — 市場代碼列表
- `GET /v1/meta/store-listing?market=tw` — 單一市場（`tw`｜`us`｜`jp`｜`kr`｜`vn`｜`cn`）
- `GET /v1/meta/store-catalog?locale=zh-CN` — 依語系解析市場
- `GET /v1/meta/store-catalog?market=tw` — 文案 + PPP 訂閱價 + 呼呼幣包建議價 + `com.ctrlz.huhu.*` SKU
- `GET /v1/meta/economy` — 體力／呼呼幣消耗常數（客戶端規則說明）

原始檔：`apps/api/src/data/store-listings/{zh-TW,zh-CN,en,ja,ko,vi}.json`

營運預覽頁：`http://localhost:3000/aso.html`（可帶 `?market=vn`）

離線匯出：`pnpm export:store-catalog` 或 `node scripts/export-store-catalog.mjs tw`
