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
  "- Render 已有 `GOOGLE_PLAY_PACKAGE_NAME=com.ctrlz.huhu`",
  "- 缺 Play 服務帳戶憑證 → `productionReady: false`",
  "- 建議用 **Secret File**（避免 env JSON 過長／轉義問題）",
  "",
  "## 1. Play Console — API 存取",
  "",
  "1. 開啟 [Users and permissions → API access](https://play.google.com/console/u/0/developers/" +
    `${PLAY_DEV_ID}/users-and-permissions/api-access)`,
  "2. 連結 GCP 專案（或建立新專案）",
  "3. 建立服務帳戶 → 授予 **View financial data**（訂閱驗證）",
  "4. 在 Play Console 對該 SA 按 **Grant access** → 權限至少 **View app information** + **View financial data**",
  "5. GCP → IAM → 服務帳戶 → Keys → Add key → JSON 下載",
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
  "pnpm check:iap",
  "curl https://huhu-api.onrender.com/v1/meta/iap-readiness",
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
