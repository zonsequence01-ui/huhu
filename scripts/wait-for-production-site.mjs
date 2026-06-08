/**
 * Poll until production privacy URL returns 200 (post-deploy hook).
 * Usage: pnpm wait:site
 * Env: WAIT_SITE_MAX_MS (default 300000), WAIT_SITE_INTERVAL_MS (default 10000)
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const maxMs = Number(process.env.WAIT_SITE_MAX_MS ?? 300_000);
const intervalMs = Number(process.env.WAIT_SITE_INTERVAL_MS ?? 10_000);
const started = Date.now();

console.log(`Waiting for production site (max ${maxMs / 1000}s)…\n`);

while (Date.now() - started < maxMs) {
  const r = spawnSync("node", ["scripts/check-production-site.mjs"], {
    cwd: root,
    encoding: "utf8",
    env: process.env,
  });
  if (r.status === 0) {
    console.log(r.stdout ?? "");
    process.exit(0);
  }
  const elapsed = Math.round((Date.now() - started) / 1000);
  console.log(`[${elapsed}s] not ready yet…`);
  await new Promise((resolve) => setTimeout(resolve, intervalMs));
}

console.error(`Timed out after ${maxMs / 1000}s — DNS or deploy still pending.`);
process.exit(1);
