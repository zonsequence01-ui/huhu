/**
 * Export App Store IAP review screenshots (shows coin packs in-app).
 * Apple requires one screenshot per consumable IAP; all packs appear on the subscribe screen.
 *
 * Usage: pnpm export:iap-review-screenshots
 */
import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  IAP_COIN_PRODUCT_IDS,
  IAP_SUBSCRIPTION_LEGACY_IOS_IDS,
} from "@huhu/shared";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "dist/iap-review-screenshots");
const sourceCandidates = [
  join(root, "dist/store-upload/tw/app-store/05-subscribe.png"),
  join(root, "dist/aso-screenshots/tw/05-subscribe.png"),
  join(root, "dist/aso-screenshots-captioned/tw/05-subscribe.png"),
];

const source = sourceCandidates.find((p) => existsSync(p));
if (!source) {
  console.error(
    "Missing subscribe screenshot. Run: pnpm capture:aso-screenshots -- --market=tw && pnpm package:store-upload",
  );
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });

const packs = [
  { id: IAP_COIN_PRODUCT_IDS.small, label: "small", coins: 50 },
  { id: IAP_COIN_PRODUCT_IDS.medium, label: "medium", coins: 150 },
  { id: IAP_COIN_PRODUCT_IDS.large, label: "large", coins: 400 },
];

const subs = [
  { id: IAP_SUBSCRIPTION_LEGACY_IOS_IDS.lite, label: "lite" },
  { id: IAP_SUBSCRIPTION_LEGACY_IOS_IDS.basic, label: "basic" },
  { id: IAP_SUBSCRIPTION_LEGACY_IOS_IDS.premium, label: "premium" },
];

for (const pack of packs) {
  const dest = join(outDir, `${pack.id}.png`);
  cpSync(source, dest);
}

for (const sub of subs) {
  const dest = join(outDir, `${sub.id}.png`);
  cpSync(source, dest);
}

const readme = [
  "# IAP review screenshots (App Store Connect)",
  "",
  "Upload each PNG to **Review Information → Screenshot** on the matching IAP:",
  "",
  "## Consumables",
  ...packs.map(
    (p) =>
      `- \`${p.id}.png\` — ${p.coins} coins (${p.label} pack)`,
  ),
  "",
  "## Subscriptions (ASC legacy Product IDs)",
  ...subs.map((s) => `- \`${s.id}.png\` — ${s.label} monthly`),
  "",
  `Source: \`${source.replace(/\\/g, "/")}\` (subscribe screen shows coin packs + subscription tiers).`,
  "",
  "## Subscription group localization (required)",
  "",
  "Before subscriptions show **Ready to Submit**, add **Subscription Group → Localization**",
  "(e.g. zh-TW display name `呼呼會員方案`). Missing group localization keeps all tiers at **Missing Metadata**.",
  "",
  "After upload, attach all IAPs on **iOS App → Version 1.0 → In-App Purchases** before submission.",
].join("\n");

writeFileSync(join(outDir, "README.md"), readme);
console.log(
  `wrote ${outDir} (${packs.length + subs.length} files from ${source})`,
);
