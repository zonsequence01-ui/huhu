/**
 * Export Play closed-testing ops pack for production access gate.
 * Usage: pnpm export:play-closed-test
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  PLAY_ALPHA_TRACK_ID,
  PLAY_CONSOLE_BASE,
  PLAY_INTERNAL_TRACK_ID,
  PLAY_OPT_IN_URL,
} from "./play-console-ids.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "dist/play-closed-test");
const optInUrl = PLAY_OPT_IN_URL;
const consoleBase = PLAY_CONSOLE_BASE;
const closedAlphaTrackId = PLAY_ALPHA_TRACK_ID;
const internalTrackId = PLAY_INTERNAL_TRACK_ID;

const lines = [
  "# Google Play 封閉測試（Production access 前置）",
  "",
  `Generated: ${new Date().toISOString()}`,
  "",
  "## 現況",
  "",
  "| 項目 | 狀態 |",
  "|------|------|",
  "| Alpha 版本 | **1.0.2 (3) 已發布**（2026-06-08）；edge-to-edge 修正 |",
  "| Opt-in 測試者 | **1 / 12**（Dashboard 實測）；名單「Test」含 1 位 |",
  "| 意見回饋 URL | `https://huhu-app.pages.dev/support` ✓ |",
  "| 正式版權限：封閉測試 | ✓ |",
  "| 測試人員（需 **12** 名） | **手動更新** — 於 Console 查看 |",
  "| 連續測試期（需 **14** 天） | **手動更新** — 自 12 人 opt-in 起算 |",
  "",
  "【假設】Google Play 正式版權限仍要求 12 名 opt-in 測試者連續 14 天；以 Console 儀表板為準。",
  "",
  "## Opt-in 連結（分享給測試者）",
  "",
  "```",
  optInUrl,
  "```",
  "",
  "測試者需使用 **Google 帳號** 開啟連結 → 加入測試 → 從 Play 商店安裝。",
  "",
  "## Play Console 捷徑",
  "",
  `- Alpha 軌道：\`${consoleBase}/tracks/${closedAlphaTrackId}\``,
  `- Alpha 測試人員：\`${consoleBase}/tracks/${closedAlphaTrackId}/testers\``,
  `- 內部測試軌道（勿混淆）：\`${consoleBase}/tracks/${internalTrackId}\``,
  `- 發布總覽：\`${consoleBase}/publishing\``,
  `- 正式版權限：\`${consoleBase}/policy/production-access\``,
  "",
  "## 操作步驟",
  "",
  "1. **Testing → Closed testing → Alpha → Testers**",
  "2. 建立或選擇 **Email list**，加入至少 **12** 個有效 Gmail（不可假帳號／不可由腳本批量建立）",
  "3. 將 opt-in 連結寄給名單；確認每人已 **Accept invite** 並安裝 App",
  "4. 在 **Dashboard → 申請正式版權限** 確認 opt-in 計數 ≥ 12",
  "5. 14 天後申請 **Production access** → 開啟正式版軌道",
  "",
  "IAP 生產驗證：`pnpm export:play-api-setup`",
  "",
  "## 測試者邀請信範本（繁中）",
  "",
  "主旨：呼呼 Huhu Android 封閉測試邀請",
  "",
  "你好，",
  "",
  "邀請你加入「呼呼 Huhu」Android 封閉測試。請用 Google 帳號開啟以下連結並加入測試：",
  "",
  optInUrl,
  "",
  "加入後請從 Google Play 安裝 **呼呼 Huhu**，使用幾天並回報問題至 support 信箱。",
  "",
  "謝謝！",
  "",
  "## Tester invite (English)",
  "",
  "Subject: Huhu Android closed testing invite",
  "",
  "Hi,",
  "",
  "You're invited to the Huhu Android closed test. Open this link with your Google account:",
  "",
  optInUrl,
  "",
  "After opting in, install **Huhu** from Google Play and use it for a few days.",
  "",
  "Thanks!",
  "",
  "## 驗證",
  "",
  "- App 連線：Release 預設 API `https://huhu-app.pages.dev`",
  "- 健康檢查：`pnpm check:render` / `pnpm smoke:api:prod`",
  "- 詳見 `docs/BLOCKERS.md`",
  "",
];

mkdirSync(outDir, { recursive: true });
const readme = join(outDir, "README.md");
writeFileSync(readme, `${lines.join("\n")}\n`);
console.log(`Wrote ${readme}`);
