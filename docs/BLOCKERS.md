# 專案外阻斷項（無法僅靠 repo 完成）



以下項目需人工／雲端帳號／商店後台，**不**代表程式碼未完成。



| 項目 | 狀態 | 驗證方式 |

|------|------|----------|

| **Phase 2 生產 API（持久）** | **Render 已部署**：`https://huhu-api.onrender.com/health` 200；Pages `API_ORIGIN` 已指向 Render。**P1**：Free tier 無 disk，重啟後 SQLite 清空；冷啟動 30–90s。持久化：Neon/Render Postgres → 設 `DATABASE_URL`（見 `docs/RENDER.md`） | `pnpm check:render`；`CHECK_SITE_REQUIRE_HEALTH=1 pnpm check:site` |

| App Store / Play 正式 IAP SKU | Play：**1.0.1 (2) 已發布**（封閉測試 Alpha，6/8 13:00）。Opt-in：`https://play.google.com/apps/testing/com.ctrlz.huhu`。**正式版權限**：✓ 封閉測試；✗ **12 名**測試人員（**1/12**）；✗ **14 天**期。App Store：Privacy URL OK；缺 **IPA**、IAP 憑證 | `pnpm check:launch`；`.env` → `pnpm check:iap` |

| 商店截圖與文案上傳 | **六市場 PNG 已產出**；ASC tw **6/6**；Play tw listing 完整 | `pnpm validate:store-upload` |

| Offerwall 第三方 SDK | 未整合 | 後端 HMAC + `GET /v1/meta/offerwall` 已就緒 |

| 全球 LB + GPU Llama 節點 | 待 infra | `docs/DEPLOYMENT.md` |

| 生產 LLM 金鑰與 ZDR 合約 | 待營運 | `LLM_PROVIDER=hybrid` + 商用 API 企業條款 |

| GitHub Actions CI | `.github/workflows/ci.yml` 已撰寫但未推送（PAT 缺 `workflow` scope） | 更新 PAT 後 `pnpm push:github` 或手動上傳 workflow |



## 封閉測試 App 連線



Release 建置預設 API：`https://huhu-app.pages.dev`。**1.0.1+** 會自動忽略本機 dev API 覆寫（`10.0.2.2:3000`）。若仍用 **1.0.0**：清除 App 資料或手動改回正式 URL。



Opt-in：`https://play.google.com/apps/testing/com.ctrlz.huhu`



程式碼 MVP 完成度見 `docs/PRODUCT_STATUS.md`。營運快照：`pnpm export:operations-status`。

