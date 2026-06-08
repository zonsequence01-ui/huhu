/**
 * Copy Flutter release AAB into dist/android-release for Play Console upload.
 * Prerequisite: pnpm build:android
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  STORE_PRIVACY_URL,
  STORE_PUBLIC_SITE_URL,
  STORE_SUPPORT_URL,
} from "@huhu/shared";

const PRODUCTION_API_BASE = STORE_PUBLIC_SITE_URL.replace(/\/$/, "");

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function readAppVersion() {
  const pubspec = join(root, "apps/mobile/pubspec.yaml");
  const m = readFileSync(pubspec, "utf8").match(/^version:\s*(\S+)/m);
  if (!m) return { name: "1.0.0", code: "1", label: "1.0.0 (1)" };
  const [name, code] = m[1].split("+");
  return { name, code, label: `${code} (${name})` };
}

const appVersion = readAppVersion();

const aabSrc = join(
  root,
  "apps/mobile/build/app/outputs/bundle/release/app-release.aab",
);
const outDir = join(root, "dist/android-release");
const aabDest = join(outDir, "com.ctrlz.huhu-release.aab");

if (!existsSync(aabSrc)) {
  console.error("Missing AAB. Run: pnpm build:android");
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });
copyFileSync(aabSrc, aabDest);
const sizeMb = (statSync(aabDest).size / (1024 * 1024)).toFixed(1);

writeFileSync(
  join(outDir, "README.md"),
  `# Android release bundle

- Package: \`com.ctrlz.huhu\`
- File: \`com.ctrlz.huhu-release.aab\` (${sizeMb} MB)
- Signed with local upload keystore (\`pnpm setup:android-signing\`; gitignored).

## Play Console

1. Open **Testing → Closed testing → Alpha** → edit draft or create release.
2. If a **debug-signed** bundle is attached, click **Remove** first.
3. Run \`pnpm serve:android-aab\` in another terminal, then upload \`com.ctrlz.huhu-release.aab\` (or use browser DataTransfer injection).
4. Version name \`${appVersion.label}\` + zh-TW release notes → **Save** → submit on **Publishing overview**.
5. After Google processes the bundle, subscriptions/coins per \`dist/play-iap-products/\` and \`docs/STORE_IAP.md\`.
`,
);

writeFileSync(
  join(outDir, "build-meta.json"),
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      package: "com.ctrlz.huhu",
      versionName: appVersion.name,
      versionCode: Number(appVersion.code),
      apiBase: PRODUCTION_API_BASE,
      dartDefineApiBase: PRODUCTION_API_BASE,
      aabBytes: statSync(aabDest).size,
    },
    null,
    2,
  )}\n`,
);

writeFileSync(
  join(outDir, "PLAY_UPLOAD.md"),
  `# Play Console 內部測試上傳

## 檔案

\`com.ctrlz.huhu-release.aab\` (${sizeMb} MB) — **release 簽章**。Play 若顯示「偵錯模式簽署」，請執行 \`pnpm build:android\` 後重傳。

## 步驟

1. 測試及發布 → **封閉測試 - Alpha** → 編輯版本
2. 移除舊 debug AAB → 上傳 \`com.ctrlz.huhu-release.aab\`（可先 \`pnpm serve:android-aab\` 供瀏覽器注入）
3. 版本名稱 \`${appVersion.label}\` → 發布總覽送審

## IAP SKU

見 \`dist/play-iap-products/\`、\`dist/iap-store-checklist/\` 與 \`docs/STORE_IAP.md\`

## 商店政策 URL

- 隱私權政策：\`${STORE_PRIVACY_URL}\`（應用程式內容 → 隱私權政策）
- 支援：\`${STORE_SUPPORT_URL}\`
`,
);

console.log(`✓ ${aabDest} (${sizeMb} MB)`);
