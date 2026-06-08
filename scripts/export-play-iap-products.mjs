/**
 * Export Play Console IAP product definitions for manual creation.
 * Usage: pnpm export:play-iap-products
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  IAP_SUBSCRIPTION_PRODUCT_IDS,
  IAP_COIN_PRODUCT_IDS,
  STORE_PRIVACY_URL,
  STORE_SUPPORT_URL,
  getPricing,
} from "@huhu/shared";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "dist/play-iap-products");
mkdirSync(outDir, { recursive: true });

const us = getPricing("US");
const tw = getPricing("TW");

const subs = [
  { id: IAP_SUBSCRIPTION_PRODUCT_IDS.lite, tier: "lite", name: "Huhu Lite" },
  { id: IAP_SUBSCRIPTION_PRODUCT_IDS.basic, tier: "basic", name: "Huhu Basic" },
  {
    id: IAP_SUBSCRIPTION_PRODUCT_IDS.premium,
    tier: "premium",
    name: "Huhu Premium",
  },
];

const coins = [
  { id: IAP_COIN_PRODUCT_IDS.small, coins: 50, label: "Small coin pack" },
  { id: IAP_COIN_PRODUCT_IDS.medium, coins: 150, label: "Medium coin pack" },
  { id: IAP_COIN_PRODUCT_IDS.large, coins: 400, label: "Large coin pack" },
];

const catalogDir = join(root, "dist/store-catalog");
const usCatalog = existsSync(join(catalogDir, "us.json"))
  ? JSON.parse(readFileSync(join(catalogDir, "us.json"), "utf8"))
  : null;

const lines = [
  "# Google Play IAP products (manual setup)",
  "",
  "Package: `com.ctrlz.huhu`. Create after first release-signed AAB is uploaded.",
  "",
  "## Store listing URLs",
  "",
  `- Support / contact: \`${STORE_SUPPORT_URL}\``,
  `- Privacy policy: \`${STORE_PRIVACY_URL}\` (Play Console → App content → Privacy policy)`,
  "",
  "## Subscriptions (Monetize → Products → Subscriptions)",
  "",
  "Create one subscription group, then add:",
  "",
  ...subs.map(
    (s) =>
      `- **${s.name}** — Product ID: \`${s.id}\` — US ${us[s.tier]} ${us.currency}/mo — TW ${tw[s.tier]} ${tw.currency}/mo`,
  ),
  "",
  "## One-time products (Monetize → Products → One-time products)",
  "",
  ...coins.map((c) => {
    const pack = usCatalog?.coinPacks?.find((p) => p.productId === c.id);
    const price = pack
      ? `${pack.price} ${pack.currency ?? us.currency}`
      : "see store-catalog";
    return `- **${c.label}** — Product ID: \`${c.id}\` — ${c.coins} coins — suggested ${price}`;
  }),
  "",
  "Regional PPP: `dist/iap-store-checklist/` and `dist/store-catalog/*.json`.",
];

writeFileSync(join(outDir, "README.md"), lines.join("\n"));
writeFileSync(
  join(outDir, "products.json"),
  JSON.stringify({ subscriptions: subs, coins }, null, 2),
);
console.log(`wrote ${join(outDir, "README.md")}`);
