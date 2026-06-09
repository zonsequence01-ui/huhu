/**
 * Validate dist/OPERATIONS_STATUS.md structure.
 * Usage: pnpm validate:operations-status
 */
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const path = join(root, "dist/OPERATIONS_STATUS.md");

if (!existsSync(path)) {
  console.error(`Missing ${path}. Run: pnpm export:operations-status`);
  process.exit(1);
}

const text = readFileSync(path, "utf8");
const required = [
  "## Production site",
  "## Deploy bundle",
  "## Android release",
  "## IAP readiness",
  "productionReady:",
  "androidProductionReady:",
  "source: **",
  "Play API probe:",
  "Play catalog probe:",
  "pnpm check:play-api",
  "pnpm check:play-catalog",
  "privacy:",
  "pnpm check:site",
  "## Blueprint pricing",
  "## Launch artifacts",
  "pnpm verify",
  "pnpm prelaunch",
  "pnpm check:launch",
  "pnpm smoke:api:local",
  "pnpm smoke:api:prod",
  "pnpm check:site",
  "pnpm ship:android",
];

let failed = false;
for (const needle of required) {
  if (!text.includes(needle)) {
    console.error(`✗ OPERATIONS_STATUS.md missing: ${needle}`);
    failed = true;
  }
}

if (failed) {
  console.error("\nOPERATIONS_STATUS validation FAILED");
  process.exit(1);
}

console.log("OPERATIONS_STATUS validation OK");
