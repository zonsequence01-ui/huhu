/**
 * Smoke-test the public production site (default STORE_PUBLIC_SITE_URL).
 * Usage: pnpm smoke:api:prod
 * Env: PROD_SMOKE_URL overrides default STORE_PUBLIC_SITE_URL (not SMOKE_BASE_URL).
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { STORE_PUBLIC_SITE_URL } from "@huhu/shared";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const base = (process.env.PROD_SMOKE_URL ?? STORE_PUBLIC_SITE_URL).replace(
  /\/$/,
  "",
);

console.log(`Production smoke @ ${base}\n`);

const r = spawnSync("node", ["scripts/smoke-public-api.mjs"], {
  cwd: root,
  env: { ...process.env, SMOKE_BASE_URL: base },
  stdio: "inherit",
});

if (r.status !== 0) {
  console.error(
    `\nProduction smoke FAILED for ${base} — deploy API (see docs/DEPLOYMENT.md) or set PROD_SMOKE_URL.`,
  );
  process.exit(r.status ?? 1);
}
