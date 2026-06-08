/**
 * Export App Store Connect metadata + IAP definitions for manual setup.
 * Usage: pnpm export:app-store-connect
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BUNDLE_ID,
  STORE_MARKETS,
  IAP_SUBSCRIPTION_PRODUCT_IDS,
  IAP_COIN_PRODUCT_IDS,
  STORE_PRIVACY_URL,
  STORE_PUBLIC_SITE_URL,
  STORE_SUPPORT_URL,
  getPricing,
} from "@huhu/shared";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const listingsDir = join(root, "apps/api/src/data/store-listings");
const outDir = join(root, "dist/app-store-connect");
mkdirSync(outDir, { recursive: true });

const catalogDir = join(root, "dist/store-catalog");
const usCatalog = existsSync(join(catalogDir, "us.json"))
  ? JSON.parse(readFileSync(join(catalogDir, "us.json"), "utf8"))
  : null;

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

const locales = [];

for (const { market, listingFile } of STORE_MARKETS) {
  const listing = JSON.parse(
    readFileSync(join(listingsDir, `${listingFile}.json`), "utf8"),
  );
  const entry = {
    market,
    locale: listing.locale,
    bundleId: BUNDLE_ID,
    urls: {
      support: STORE_SUPPORT_URL,
      privacy: STORE_PRIVACY_URL,
      marketing: STORE_PUBLIC_SITE_URL,
    },
    appStore: {
      name: listing.appStore.name,
      subtitle: listing.appStore.subtitle,
      keywords: listing.appStore.keywords,
      promotionalText: listing.appStore.promotionalText,
      description: listing.appStore.description,
    },
    ageRating: listing.ageRating,
    screenshotCaptions: listing.screenshotCaptions,
    screenshotPaths: listing.screenshotCaptions.map((_, i) => {
      const n = String(i + 1).padStart(2, "0");
      const names = [
        "01-chat",
        "02-modes",
        "03-character-creator",
        "04-diary",
        "05-subscribe",
        "06-privacy",
      ];
      const base = names[i] ?? `0${i + 1}`;
      return `dist/store-upload/${market}/app-store/${base}.png`;
    }),
  };
  locales.push(entry);
  writeFileSync(join(outDir, `${market}.json`), JSON.stringify(entry, null, 2));
}

writeFileSync(
  join(outDir, "iap-products.json"),
  JSON.stringify({ subscriptions: subs, coins }, null, 2),
);

writeFileSync(
  join(outDir, "urls.json"),
  JSON.stringify(
    {
      bundleId: BUNDLE_ID,
      site: STORE_PUBLIC_SITE_URL,
      support: STORE_SUPPORT_URL,
      privacy: STORE_PRIVACY_URL,
    },
    null,
    2,
  ),
);

const lines = [
  "# App Store Connect setup",
  "",
  `Bundle ID: \`${BUNDLE_ID}\`. App ID in Connect: see inflight version page.`,
  "",
  "## App information URLs",
  "",
  `- **Support URL**: \`${STORE_SUPPORT_URL}\``,
  `- **Privacy Policy URL**: \`${STORE_PRIVACY_URL}\``,
  `- **Marketing URL** (optional): \`${STORE_PUBLIC_SITE_URL}\``,
  "",
  "Static pages are served from `apps/web/` via API static root. Deploy API with public HTTPS before submission.",
  "",
  "## Version metadata (per locale)",
  "",
  "Copy from `dist/app-store-connect/{market}.json` into **App Store → Version** localization.",
  "Upload screenshots from `dist/store-upload/{market}/app-store/` (1284×2778) or `*-captioned/`.",
  "",
  ...locales.map(
    (l) =>
      `- **${l.market}** (\`${l.locale}\`): name \`${l.appStore.name}\` — \`${l.market}.json\``,
  ),
  "",
  "## Subscriptions (Monetization → Subscriptions)",
  "",
  "Create one subscription group, then add:",
  "",
  ...subs.map(
    (s) =>
      `- **${s.name}** — \`${s.id}\` — US ${us[s.tier]} ${us.currency}/mo — TW ${tw[s.tier]} ${tw.currency}/mo`,
  ),
  "",
  "**Note:** If ASC subscriptions were created as `com.ctrlz.huhu.lite` (without `.sub.`), iOS clients use `GET /v1/meta/iap-products?platform=ios`; API accepts both ID forms for receipt verify.",
  "",
  "**Subscription group localization (required):** Monetization → Subscriptions → group → Localization → Create zh-TW (e.g. display name `呼呼會員方案`). Without this, all tiers stay **Missing Metadata** even when per-tier metadata looks complete.",
  "",
  "## Consumables (Monetization → In-App Purchases)",
  "",
  ...coins.map((c) => {
    const pack = usCatalog?.coinPacks?.find((p) => p.productId === c.id);
    const price = pack
      ? `${pack.price} ${pack.currency ?? us.currency}`
      : "see store-catalog";
    return `- **${c.label}** — \`${c.id}\` — ${c.coins} coins — suggested ${price}`;
  }),
  "",
  "## Build upload",
  "",
  "Requires macOS + Xcode: `pnpm build:ios` (see `dist/ios-release/README.md`).",
  "",
  "## Review notes",
  "",
  "- Age 18+ via in-app birth year gate (no ID upload).",
  "- Guest JWT sign-in; provide sandbox review account in App Review Information.",
  "- Not medical advice; crisis resources via in-app support links.",
  "",
  "## IAP review screenshots",
  "",
  "Run `pnpm export:iap-review-screenshots` → upload `dist/iap-review-screenshots/com.ctrlz.huhu.coins.*.png` to each consumable IAP **Review Information → Screenshot**, then attach IAPs on version 1.0.",
  "",
  "Regional PPP: `dist/iap-store-checklist/` and `dist/store-catalog/*.json`.",
];

writeFileSync(join(outDir, "README.md"), lines.join("\n"));
console.log(`wrote ${join(outDir, "README.md")} (${locales.length} locales)`);
