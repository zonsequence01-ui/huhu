/**
 * Export per-market IAP SKU + PPP reference for App Store Connect / Play Console.
 * Usage: pnpm export:iap-store-checklist
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { STORE_MARKETS } from "@huhu/shared";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "dist/iap-store-checklist");

const catalogDir = join(root, "dist/store-catalog");
if (!existsSync(catalogDir)) {
  spawnSync("pnpm", ["export:store-catalog:files"], {
    cwd: root,
    shell: true,
    stdio: "inherit",
  });
}

mkdirSync(outDir, { recursive: true });

const lines = [
  "# IAP store setup checklist",
  "",
  "Bundle ID: `com.ctrlz.huhu`. Create matching subscription + consumable products in each console.",
  "",
  "## Subscription SKUs (global)",
  "- `com.ctrlz.huhu.sub.lite`",
  "- `com.ctrlz.huhu.sub.basic`",
  "- `com.ctrlz.huhu.sub.premium`",
  "",
  "## PPP by market",
  "",
  "| Market | Currency | Lite | Basic | Premium | Coin packs |",
  "|--------|----------|------|-------|---------|------------|",
];

for (const { market } of STORE_MARKETS) {
  const path = join(catalogDir, `${market}.json`);
  const cat = JSON.parse(readFileSync(path, "utf8"));
  const subs = cat.pricing;
  const packs = (cat.coinPacks ?? [])
    .map((p) => `${p.productId} (${p.coins} coins, ${p.price} ${p.currency ?? cat.pricing.currency})`)
    .join("; ");
  lines.push(
    `| ${market} | ${subs.currency} | ${subs.lite} ${subs.currency} | ${subs.basic} ${subs.currency} | ${subs.premium} ${subs.currency} | ${packs || "—"} |`,
  );

  const detail = [
    `# ${market.toUpperCase()} — IAP detail`,
    "",
    "## Subscriptions",
    ...cat.productIds.subscriptions.map((id) => {
      const tier = id.includes(".sub.lite")
        ? "lite"
        : id.includes(".sub.basic")
          ? "basic"
          : "premium";
      return `- \`${id}\` — suggested ${subs[tier]} ${subs.currency}/month`;
    }),
    "",
    "## Consumables (coin packs)",
    ...(cat.coinPacks ?? []).map(
      (p) => `- \`${p.productId}\` — ${p.coins} coins, suggested ${p.price} ${p.currency ?? subs.currency}`,
    ),
    "",
    "Set App Store / Play price tiers to match PPP in `dist/store-catalog/{market}.json`.",
    "",
  ];
  writeFileSync(join(outDir, `${market}.md`), detail.join("\n"));
}

writeFileSync(join(outDir, "README.md"), lines.join("\n"));
console.log(`wrote ${join(outDir, "README.md")} and ${STORE_MARKETS.length} market files`);

const validate = spawnSync("pnpm", ["validate:iap-store-checklist"], {
  cwd: root,
  shell: true,
  stdio: "inherit",
});
if (validate.status !== 0) process.exit(validate.status ?? 1);
