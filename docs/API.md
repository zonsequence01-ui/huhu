# Huhu API 參考

Base URL: `http://localhost:3000`（開發）

## 公開端點

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/health` | 健康檢查（含 `database`、`vectorStore`、`economy` 常數） |
| GET | `/v1/meta/ui-strings?locale=zh-TW` | 客戶端 UI 文案表 |
| GET | `/v1/pricing?region=TW` | PPP 定價（US/JP/TW/VN/KR/CN） |
| GET | `/v1/meta/locales` | 支援語系與文化提示 |
| GET | `/v1/meta/store-listings` | ASO 支援市場列表（tw/us/jp/kr/vn/cn） |
| GET | `/v1/meta/store-listing?market=tw` | 該市場 App Store／Google Play 文案草稿 |
| GET | `/v1/meta/store-catalog?market=tw` | ASO 文案 + PPP 訂閱／呼呼幣包建議價 + SKU 清單（上架用） |
| GET | `/v1/meta/store-catalog?locale=ko-KR` | 依語系解析市場（`localeToStoreMarket`，含 `zh-CN`→`cn`） |
| GET | `/v1/meta/store-catalog` | 各市場 PPP 摘要列表 |
| GET | `/v1/meta/economy` | `{ economy: { stamina, coins, chatModes } }` 經濟規則常數（與藍圖一致） |
| GET | `/v1/meta/client-config?locale=` | 客戶端啟動用聚合設定（經濟、offerwall、支援資源、訂閱方案、`apiErrors`） |
| GET | `/v1/meta/support-resources?locale=zh-TW` | 隱私提醒與危機／心理健康支援資源（依語系） |
| GET | `/v1/meta/iap-readiness` | 商店驗證憑證是否就緒（上架前檢查） |
| POST | `/v1/users/bootstrap` | 建立訪客，回傳 JWT |

## 需認證（`Authorization: Bearer <token>`）

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/v1/users/me` | 使用者、體力、`subscriptionTierDisplayName`（依 `locale` 在地化）、`plan`（PPP 定價、權益、訂閱剩餘天數） |
| PATCH | `/v1/users/me/locale` | 更新使用者預設語系 |
| GET | `/v1/users/:userId/characters` | 角色列表 |
| GET | `/v1/characters/presets` | 官方角色模板 |
| POST | `/v1/characters/from-preset` | 從模板建立角色 |
| POST | `/v1/characters` | 建立角色 |
| GET | `/v1/characters/:id` | 角色與關係 |
| GET | `/v1/characters/:id/messages` | 對話歷史 |
| DELETE | `/v1/characters/:id/messages` | 清除此角色全部對話 |
| DELETE | `/v1/characters/:id/messages/:messageId` | 刪除單則訊息（Web 氣泡按鈕、Flutter 長按） |
| GET | `/v1/characters/:id/export?format=webnovel` | 匯出 Markdown 網路小說 |
| GET | `/v1/characters/:id/diary?limit=20` | 虛擬日記列表 |
| POST | `/v1/characters/:id/diary` | 新增日記（寫入 RAG 記憶） |
| PATCH | `/v1/characters/:id/diary/:entryId` | 更新日記（重索引 RAG） |
| DELETE | `/v1/characters/:id/diary/:entryId` | 刪除日記與對應記憶片段 |
| GET | `/v1/characters/:id/moments?limit=20` | 單角色動態列表 |
| GET | `/v1/feed/moments?limit=30` | 使用者所有角色的動態時間軸（含 `characterName`） |
| GET | `/v1/feed/moments/public?limit=30` | 全域公開動態（`visibility=public`，需登入） |
| POST | `/v1/characters/:id/moments` | 發布動態；body 可含 `visibility`（`private` \| `public`，預設 private）、可選圖片，寫入 RAG |
| PATCH | `/v1/characters/:id/moments/:momentId` | 更新 `visibility` |
| DELETE | `/v1/characters/:id/moments/:momentId` | 刪除動態與對應記憶片段 |
| POST | `/v1/feed/moments/:momentId/report` | 檢舉公開動態；body `{ reason: spam \| harassment \| inappropriate \| other }`；同一使用者僅能檢舉一次；達 `MOMENT_REPORT_HIDE_THRESHOLD`（預設 3）則自動從社群 feed 隱藏 |
| POST | `/v1/chat` | 發送訊息 |
| POST | `/v1/rewards/offerwall/prepare` | 發放一次性 HMAC 領幣憑證（需 `OFFERWALL_SECRET`） |
| POST | `/v1/rewards/offerwall` | 觀看廣告領幣；設 `OFFERWALL_SECRET` 時需 prepare 或 webhook 簽章欄位 |
| POST | `/v1/webhooks/offerwall` | Offerwall 伺服器回調（HMAC，見 `docs/OFFERWALL.md`） |
| POST | `/v1/users/me/age-confirm` | 18+ 年齡確認（`birthYear`，無證件上傳） |
| POST | `/v1/rewards/daily-checkin` | 每日簽到領幣（每日一次） |
| POST | `/v1/iap/verify` | IAP 收據驗證（開發 stub） |
| PATCH | `/v1/users/me/subscription` | 開發用訂閱升級（預設 30 天 `subscriptionExpiresAt`）；非 production 可選 `expiresAt`、`stamina`（E2E／本機測試） |
| PATCH | `/v1/users/me/dev-economy` | 非 production：調整 `stamina`、`coins`（E2E／本機；production 回 `dev_only`） |
| POST | `/v1/characters/:id/relationship/reset` | 重置好感度 |
| GET | `/v1/characters/:id/memories?limit=50` | 列出 RAG 記憶片段（`id`、`preview`、不含向量） |
| DELETE | `/v1/characters/:id/memories/:memoryId` | 刪除單一 RAG 記憶片段 |
| DELETE | `/v1/characters/:id/memories` | 清除此角色全部 RAG 記憶 |
| DELETE | `/v1/users/me/data` | 刪除帳號資料 |

## Chat 請求範例

```json
{
  "characterId": "xxx",
  "content": "你好",
  "mode": "simple",
  "messageType": "text"
}
```

`mode`: `simple` | `long` | `exciting`  
`messageType`: `text` | `voice`（3 體力，需 Basic 級或以上訂閱）| `image`（2 體力）

語音輸入可選 `voiceAudioBase64` + `voiceMimeType`（需 `OPENAI_API_KEY`，Whisper 轉文字）；若 STT 失敗可改以 `content` 文字送出。

照片：`imageBase64` + `imageMimeType`（`image/jpeg`／`png`／`webp`，最大 2MB，消耗 2 體力）。`content` 為選填說明。若設定 `OPENAI_API_KEY`，後端以 Vision 產生圖片描述再送入 LLM。回覆 `reply.userMedia` 回顯原圖；歷史 `GET .../messages` 含 `media`。

語音回覆 `reply.voice`：`transcript` 必填；若設定 `TTS_PROVIDER=openai` 且具 API Key，另含 `audioBase64` + `mimeType`。

成功回應含 `userMessageId`（使用者訊息 id）與 `reply.id`（助理訊息 id），供客戶端在送出後立即刪除單則訊息，無需重新載入歷史。

對話會帶入最近 12 則歷史與 RAG 記憶片段後再呼叫 LLM。

安全攔截：`crisis`（自傷／自殺）與 `wellness`（長期抑鬱傾向）會直接回傳資源訊息，不呼叫 LLM、不寫入 RAG。使用者與安全回覆仍會寫入訊息表；`GET .../messages` 的 assistant 訊息可含 `safety: { flagged: true, category: "crisis"|"wellness" }`。

角色崩壞修正：若 LLM 回覆含 AI 元敘述，`guardCharacterReply` 會替換為 in-character fallback。即時回覆含 `characterCorrected: true`；歷史訊息同欄位由 `mediaJson.characterGuard.corrected` 還原。測試：mock LLM 設 `LLM_MOCK_BREAK_CHARACTER=1`，或使用者訊息含 `__mock_break_character__`（僅 mock provider）。

## IAP 驗證

`POST /v1/iap/verify` body：

| 欄位 | 說明 |
|------|------|
| `platform` | `ios` \| `android` \| `web` |
| `productId` | 商店 SKU |
| `receipt` | 收據或 JWS |
| `transactionId` | 選填；建議客戶端傳商店交易 ID，冪等鍵優先使用 |

冪等以 `transactionId`（JWS payload、`gp:` token、`dev_stub:` 等）為準，非整段收據字串。同一交易 ID 僅能兌換一次；其他使用者重放回 `409 receipt_already_redeemed`。

開發收據（未設定 `APPLE_IAP_SHARED_SECRET` 時）：

```json
{
  "platform": "ios",
  "productId": "com.ctrlz.huhu.sub.lite",
  "receipt": "valid_com.ctrlz.huhu.sub.lite"
}
```

設定 `APPLE_IAP_SHARED_SECRET` 後，iOS 會呼叫 Apple `verifyReceipt`（production 收到 status `21007` 時自動改打 sandbox）。`APPLE_IAP_SANDBOX=1` 可強制僅打 sandbox。測試用 stub 收據：`base64-receipt-stub-ok`。

**App Store Server API v2（JWS）**：若 `receipt` 為三段的 `signedTransaction` JWS，改走 JWS 路徑。開發 stub：`valid_jws_<productId>`。設定 `APPLE_APP_STORE_BUNDLE_ID` 後以 JWS header `x5c` 葉憑證驗簽（`jose`），並驗證 `x5c` 鏈錨定至內建 **Apple Root CA G3/G2**（`apps/api/certs/`；可用 `APPLE_APP_STORE_ROOT_PIN=0` 關閉）。Staging 可另設 `APPLE_APP_STORE_JWS_DECODE_ONLY=1` 跳過驗簽（**禁止** production）。

Android：收據格式 `gp:<purchaseToken>` 或 `gp:<productId>:<purchaseToken>`。設定 `GOOGLE_PLAY_PACKAGE_NAME` + `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` 時呼叫 Play Developer API；否則非 production 可用 `GOOGLE_PLAY_STUB=1` 或 `gp:` 前綴 stub。

## 客戶端設定與 API 錯誤碼

`GET /v1/meta/client-config?locale=zh-TW` 一次回傳經濟規則、`offerwall`、`supportResources`、`subscriptionTiers`（含 `tierDisplayName`、`entitlementsLabel`）、`subscriptionTiersPrompt`，以及 **`config.apiErrors`**：依 `locale` 預先翻譯的常見 `error` 字串表（與 `@huhu/shared` 的 `API_ERROR_CODES`／`formatApiErrorMessage` 同步）。

Web／Flutter 應在啟動時載入並快取 `apiErrors`，將 API 回應的 `error` 欄位對應為使用者可讀訊息（未知碼可回退顯示原始 code）。

| `error` | HTTP | 說明 |
|---------|------|------|
| `content_required` | 400 | 聊天／表單缺少有效文字或媒體 |
| `insufficient_stamina` | 402 | 體力不足（非訂閱無限體力） |
| `insufficient_coins` | 402 | 呼呼幣不足（長對話／心動模式等） |
| `voice_requires_basic_subscription` | 403 | 語音需 Basic 或以上；`apiErrors` 文案含在地化方案名 |
| `character_limit_reached` | 403 | 免費方案角色數上限 |
| `character_not_found` | 404 | 角色不存在或已刪除；Web 會清除無效 `huhu_characterId`、切換既有角色或建立預設角色 |
| `age_confirmation_required` | 403 | 須完成 18+ 出生年份確認（`AGE_GATE=0` 時關閉；E2E 見 `e2e/age-gate.spec.ts`） |
| `validation_failed` | 400 | 請求 body 驗證失敗（Zod 等） |
| `rate_limited` | 429 | 請求過於頻繁 |

其餘驗證失敗（Zod）多回 `400` + `validation_failed`；業務邏輯專用碼見各端點說明。

## 其他 Meta

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/v1/meta/default-character?locale=` | 依語系回傳預設官方角色（`en`→Alex、`ja`→さくら、`ko`→민호、`zh-CN`→小呼簡中） |
| GET | `/v1/meta/iap-products` | 訂閱 SKU、虛擬貨幣 SKU、檢舉理由列舉（供行動端／Web 對照商店） |

## 社群動態檢舉與營運覆核

| 方法 | 路徑 | 說明 |
|------|------|------|
| POST | `/v1/feed/moments/:momentId/report` | Body `{ "reason": "spam" \| "harassment" \| "inappropriate" \| "other" }`；同使用者不可重複檢舉 |
| GET | `/v1/admin/moments/hidden?limit=30` | 需標頭 `x-admin-key: <ADMIN_API_KEY>`；列出被自動隱藏的公開動態 |
| POST | `/v1/admin/moments/:momentId/restore` | 同上；將 `moderation_status` 設回 `active` 並**清除該則檢舉紀錄**（仍須 `visibility=public` 才會出現在社群 feed） |

隱藏列表每則含 `reportCount`。營運 UI：`/admin.html`（瀏覽器儲存 `x-admin-key`）。

## 好友與動態可見範圍

| 方法 | 路徑 | 說明 |
|------|------|------|
| POST | `/v1/friends/request` | Body `{ "targetUserId": "..." }` 或 `{ "inviteCode": "ABCD2345" }`（二擇一）；若對方已向你送出待處理邀請則自動互為好友 |
| POST | `/v1/friends/:friendshipId/accept` | 接受待處理邀請 |
| GET | `/v1/friends` | 已接受好友列表 |
| GET | `/v1/friends/requests` | `{ incoming, outgoing }` 待處理邀請 |
| GET | `/v1/users/search?q=` | 依暱稱（子字串，不分大小寫）或邀請碼（精確／前綴）搜尋；回 `{ results: [{ userId, displayName, inviteCode, matchType }] }`；排除自己與封鎖關係；每小時預設 60 次（`USER_SEARCH_RATE_LIMIT`） |
| PATCH | `/v1/users/me/display-name` | Body `{ "displayName": "..." }`（2–32 字元）；供暱稱搜尋使用 |
| GET | `/v1/users/me/invite-qr` | `{ dataUrl, payload }` PNG Data URL（優先編碼 `inviteLink`，否則為 `inviteCode`） |
| GET | `/v1/blocks` | `{ blocked: [{ userId, displayName, createdAt }] }` |
| POST | `/v1/blocks` | Body `{ "userId": "..." }` 封鎖並移除雙向好友關係 |
| DELETE | `/v1/blocks/:userId` | 解除封鎖 |
| GET | `/v1/feed/moments/friends` | 好友可見動態（`visibility=friends` 且雙方已接受好友） |

動態 `visibility`：`private` | `friends` | `public`。

未設定 `ADMIN_API_KEY` 時，admin 路由回傳 `503 admin_not_configured`。`GET /health` 含 `moderation.reportHideThreshold` 與 `moderation.adminApiConfigured`。

`GET /v1/users/me` 回傳 `inviteCode`（8 碼英數，首次讀取時自動產生）；若設定 `PUBLIC_WEB_URL` 另回傳 `inviteLink`（`/?invite=<code>` 深連結）。`POST /v1/friends/request` 每使用者每小時預設最多 30 次（`FRIEND_REQUEST_RATE_LIMIT`），超過回 `429 rate_limited`；若任一方已封鎖對方則回 `403 blocked`。`plan.entitlements` 含 `memoryRetrievalLimit`、`maxReplyTokens`（Basic 記憶檢索 16 條、回覆上限 3000 tokens）。

非 production 且未設定商店密鑰時，亦可使用長度 ≥8 的任意 `receipt`（`MOCK_IAP=1` 時）。產品 ID 見 `packages/shared/src/iap-products.ts`。

訂閱到期後，`GET /v1/users/me` 與聊天前同步會自動降級為 `free`。【假設】週期為 30 天，續訂自現有到期日疊加。

有效訂閱每月首次同步會發放呼呼幣：Lite 30 / Basic 80 / Premium 150（與 IAP 開通一次性贈幣分開）。

## 隱私與資料自主

| 方法 | 路徑 | 說明 |
|------|------|------|
| POST | `/v1/characters/:id/relationship/reset` | 重置好感度與關係階段 |
| DELETE | `/v1/characters/:id/memories` | 清除 RAG 向量記憶（對話 SQLite 紀錄保留） |
| DELETE | `/v1/characters/:id/messages` | 清除此角色全部對話 |
| DELETE | `/v1/characters/:id/messages/:messageId` | 刪除單則訊息（Web 氣泡按鈕、Flutter 長按） |
| DELETE | `/v1/users/me/data` | 刪除帳號、角色、對話、記憶與 IAP 紀錄（不可復原） |

無 body 的 `DELETE`／`POST` 建議勿帶 `Content-Type: application/json`（部分舊版客戶端會誤帶）。API 會在無 payload 時自動移除該 header，避免 Fastify 400。適用端點含：刪除單則／全部訊息、清除 RAG 記憶、重置關係、刪除帳號資料。

PII 清洗：LLM 請求與 RAG 索引／檢索會 mask email、電話、地址；聊天歷史 SQLite 仍存原文供 UI 顯示。詳見 `docs/SAFETY.md`。
