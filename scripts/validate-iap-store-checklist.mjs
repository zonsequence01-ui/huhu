/**
 * Validate dist/iap-store-checklist export.
 * Usage: pnpm validate:iap-store-checklist
 */
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { STORE_MARKETS } from "@huhu/shared";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(root, "dist/iap-store-checklist");

let failed = false;
if (!existsSync(join(dir, "README.md"))) {
  console.error("✗ missing dist/iap-store-checklist/README.md — run pnpm export:iap-store-checklist");
  process.exit(1);
}

const readme = readFileSync(join(dir, "README.md"), "utf8");
if (!readme.includes("com.ctrlz.huhu.sub.lite")) {
  console.error("✗ README missing subscription SKU");
  failed = true;
}

for (const { market } of STORE_MARKETS) {
  const path = join(dir, `${market}.md`);
  if (!existsSync(path)) {
    console.error(`✗ missing ${path}`);
    failed = true;
    continue;
  }
  const text = readFileSync(path, "utf8");
  if (!text.includes("com.ctrlz.huhu.sub.lite")) {
    console.error(`✗ ${market}.md missing lite SKU`);
    failed = true;
    continue;
  }
  console.log(`✓ ${market}.md`);
}

if (failed) process.exit(1);
console.log("\nIAP store checklist validation OK");
