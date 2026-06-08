/**
 * Verify local prod stack: API :3000, cloudflared tunnel, optional Pages /health.
 * Usage: pnpm health:prod-stack
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { STORE_PUBLIC_SITE_URL } from "@huhu/shared";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const statePath = join(root, "dist/prod-stack-state.json");

let failed = false;

async function check(label, url) {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`✗ ${label} ${url} → ${res.status}`);
      failed = true;
      return;
    }
    console.log(`✓ ${label} ${url} → ${res.status}`);
  } catch (err) {
    console.error(`✗ ${label} ${url} → ${err.message}`);
    failed = true;
  }
}

console.log("=== Production stack health ===\n");

await check("local API", "http://127.0.0.1:3000/health");

if (existsSync(statePath)) {
  const state = JSON.parse(readFileSync(statePath, "utf8"));
  if (state.tunnelUrl) {
    await check("cloudflared tunnel", `${state.tunnelUrl}/health`);
  }
} else {
  console.log("⚠ no dist/prod-stack-state.json — run pnpm start:prod-stack");
}

const pagesBase = (process.env.PROD_SMOKE_URL ?? STORE_PUBLIC_SITE_URL).replace(/\/$/, "");
await check("Pages proxy", `${pagesBase}/health`);

if (failed) process.exit(1);
console.log("\nHealth OK");
