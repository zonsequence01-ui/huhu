/**
 * Validate dist/launch-bundle handoff folder.
 * Usage: pnpm validate:launch-bundle
 */
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { STORE_MARKETS } from "@huhu/shared";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const bundle = join(root, "dist/launch-bundle");

const requiredDocs = [
  "LAUNCH.md",
  "README.md",
  "manifest.json",
  "API_PUBLIC.md",
  "BLOCKERS.md",
  "OPERATIONS_STATUS.md",
];
const optionalDocs = [
  "STORE_IAP.md",
  "ASO_SCREENSHOTS.md",
  "OFFERWALL.md",
  "DEPLOYMENT.md",
  "PRODUCT_STATUS.md",
  "SAFETY.md",
];
let failed = false;

if (!existsSync(bundle)) {
  console.log(
    "Skip: dist/launch-bundle missing (requires ASO PNG). Run: pnpm package:launch-bundle",
  );
  process.exit(0);
}

for (const name of requiredDocs) {
  const p = join(bundle, name);
  if (!existsSync(p)) {
    console.error(`✗ missing ${name}`);
    failed = true;
  } else {
    console.log(`✓ ${name}`);
  }
}

for (const name of optionalDocs) {
  const p = join(bundle, name);
  console.log(existsSync(p) ? `✓ ${name}` : `○ ${name} (optional)`);
}

const manifestPath = join(bundle, "manifest.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
if (manifest.bundleId !== "com.ctrlz.huhu") {
  console.error("✗ manifest.bundleId mismatch");
  failed = true;
}

const briefDir = join(bundle, "aso-brief");
let briefCount = 0;
for (const { market } of STORE_MARKETS) {
  if (existsSync(join(briefDir, `${market}.md`))) briefCount += 1;
}
if (briefCount !== STORE_MARKETS.length) {
  console.error(
    `✗ aso-brief (${briefCount}/${STORE_MARKETS.length} markets)`,
  );
  failed = true;
} else {
  console.log(`✓ aso-brief (${briefCount} markets)`);
}

if (!existsSync(join(bundle, "iap-store-checklist", "README.md"))) {
  console.error("✗ missing iap-store-checklist/README.md");
  failed = true;
} else {
  console.log("✓ iap-store-checklist");
}

const opsPath = join(bundle, "OPERATIONS_STATUS.md");
if (existsSync(opsPath)) {
  const ops = readFileSync(opsPath, "utf8");
  for (const needle of ["pnpm verify", "pnpm prelaunch", "pnpm smoke:api:local"]) {
    if (!ops.includes(needle)) {
      console.error(`✗ OPERATIONS_STATUS.md missing: ${needle}`);
      failed = true;
    }
  }
  if (!failed) console.log("✓ OPERATIONS_STATUS.md (release commands)");
}

const launchPath = join(bundle, "LAUNCH.md");
if (existsSync(launchPath)) {
  const launch = readFileSync(launchPath, "utf8");
  if (!launch.includes("pnpm prelaunch")) {
    console.error("✗ LAUNCH.md missing pnpm prelaunch");
    failed = true;
  } else {
    console.log("✓ LAUNCH.md (prelaunch)");
  }
}

if (failed) {
  console.error("\nLaunch bundle validation FAILED");
  process.exit(1);
}

console.log("\nLaunch bundle validation OK");
