/**
 * Export Play Developer API + Render IAP setup pack.
 * Usage: pnpm export:play-api-setup
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PLAY_CONSOLE_BASE, PLAY_DEV_ID } from "./play-console-ids.mjs";

const GOOGLE_PLAY_SA_DEFAULT_SECRET_PATH = "/etc/secrets/google-play-sa.json";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "dist/play-api-setup");

const lines = [
  "# Google Play IAP API → Render 設定",
  "",
  `Generated: ${new Date().toISOString()}`,
  "",
  "## 現況",
  "",
  "- Render：`GOOGLE_PLAY_PACKAGE_NAME=com.ctrlz.huhu`",
  "- Secret File：`google-play-sa.json` → `/etc/secrets/google-play-sa.json`",
  "- `GOOGLE_PLAY_SERVICE_ACCOUNT_PATH` + `IAP_STRICT=true`（勿再用 env JSON）",
  "- `pnpm check:render` → `playApi=true`",
  "- **待完成**：Play Console **Invite user** 授權 SA（`pnpm check:play-api` 驗證）",
  "",
  "## 1. Play Console — 邀請服務帳戶（2024+ 流程）",
  "",
  "【假設】舊版 **API access** 頁在部分環境 SPA 錯誤；Google 已改為 **Users and permissions → Invite user**。",
  "",
  "1. 開啟 [Invite user](https://play.google.com/console/u/0/developers/" +
    `${PLAY_DEV_ID}/users-and-permissions/invite)`,
  "2. Email：`huhu-play-iap@gen-lang-client-0985302942.iam.gserviceaccount.com`",
  "3. **應用程式權限** → **新增應用程式** → 勾選權限後 **套用** → 選 **呼呼 Huhu** → **套用**",
  "4. 權限至少：**查看應用程式資訊**、**查看財務資料**（Purchases API）、**管理訂單和訂閱**（Google 官方建議）",
  "5. 按 **邀請使用者**（SA 無需接受邀請；使用者列表應顯示 Active）",
  "6. 若仍 403：在 Play Console 編輯任一訂閱/IAP 描述並儲存以刷新權限",
  "7. 驗證：`pnpm check:play-api` → `apiAccessOk=true`",
  "",
  "GCP 端：專案 `gen-lang-client-0985302942` 已啟用 Play Android Developer API；SA JSON 已在 Render Secret File。",
  "",
  "## 2. Render — Secret File（推薦）",
  "",
  "Dashboard → huhu-api → Environment → **Secret Files** → Add file:",
  "",
  "| 欄位 | 值 |",
  "|------|-----|",
  "| Filename | `google-play-sa.json` |",
  "| Content | 下載的 SA JSON 全文 |",
  "",
  `執行時路徑：\`${GOOGLE_PLAY_SA_DEFAULT_SECRET_PATH}\`（API 自動偵測）`,
  "",
  "或設環境變數：",
  "",
  "```",
  "GOOGLE_PLAY_SERVICE_ACCOUNT_PATH=/etc/secrets/google-play-sa.json",
  "IAP_STRICT=true",
  "```",
  "",
  "替代方案（不推薦）：整段 JSON 設為 `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`",
  "",
  "## 3. 驗證",
  "",
  "```bash",
  "pnpm check:render          # /health + /v1/meta/iap-readiness",
  "pnpm check:play-api        # OAuth + Play Console Grant access",
  "pnpm check:iap",
  "curl https://huhu-api.onrender.com/v1/meta/play-api-probe",
  "```",
  "",
  "預期：`android.playApi: true`、`productionReady: true`（另需 Apple IAP 憑證）",
  "",
  "## 4. Play Console 捷徑",
  "",
  `- App：\`${PLAY_CONSOLE_BASE}\``,
  `- Subscriptions：\`${PLAY_CONSOLE_BASE}/monetization-setup/subscriptions\``,
  "",
];

mkdirSync(outDir, { recursive: true });
const readme = join(outDir, "README.md");
writeFileSync(readme, `${lines.join("\n")}\n`);
console.log(`Wrote ${readme}`);
