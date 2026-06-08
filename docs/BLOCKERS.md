# 專案外阻斷項（無法僅靠 repo 完成）



以下項目需人工／雲端帳號／商店後台，**不**代表程式碼未完成。



| 項目 | 狀態 | 驗證方式 |

|------|------|----------|

| **Phase 2 生產 API（持久）** | **已驗證**：`https://huhu-api.onrender.com/health` → `database: postgres`、`vectorStore: pgvector`。Render `DATABASE_URL` → Neon `huhu`；Blueprint `sync: false` 防覆寫 | `pnpm check:render` |

| App Store / Play 正式 IAP SKU | Play：**1.0.2 (3) Alpha 已發布**。Opt-in **1/12**。Play API：`pnpm export:play-api-setup` → Render Secret File `google-play-sa.json`。App Store：**缺 Build/IPA**（需 macOS） | `pnpm export:play-closed-test` |

| 商店截圖與文案上傳 | **六市場 PNG 已產出**；ASC tw **6/6**；Play tw listing 完整 | `pnpm validate:store-upload` |

| Offerwall 第三方 SDK | 未整合 | 後端 HMAC + `GET /v1/meta/offerwall` 已就緒 |

| 全球 LB + GPU Llama 節點 | 待 infra | `docs/DEPLOYMENT.md` |

| 生產 LLM 金鑰與 ZDR 合約 | 待營運 | `LLM_PROVIDER=hybrid` + 商用 API 企業條款 |

| GitHub Actions CI | **已通過**（`1269dc9`：node/postgres/flutter/docker-smoke 全綠） | https://github.com/zonsequence01-ui/huhu/actions |



## 封閉測試 App 連線



Release 建置預設 API：`https://huhu-app.pages.dev`。**1.0.1+** 會自動忽略本機 dev API 覆寫（`10.0.2.2:3000`）。若仍用 **1.0.0**：清除 App 資料或手動改回正式 URL。



Opt-in：`https://play.google.com/apps/testing/com.ctrlz.huhu`

詳見 `pnpm export:play-closed-test` → `dist/play-closed-test/README.md`。

