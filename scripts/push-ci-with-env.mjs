/**
 * Push main using GITHUB_TOKEN from .env.deploy (gitignored).
 * Usage: node scripts/push-ci-with-env.mjs
 */
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(root, ".env.deploy");
let token = process.env.GITHUB_TOKEN?.trim();
if (!token) {
  try {
    const raw = readFileSync(envPath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^GITHUB_TOKEN=(.+)$/);
      if (m) token = m[1].trim();
    }
  } catch {
    /* ignore */
  }
}
if (!token) {
  console.error("Set GITHUB_TOKEN or add to .env.deploy");
  process.exit(1);
}
const remote = `https://x-access-token:${token}@github.com/zonsequence01-ui/huhu.git`;
const r = spawnSync("git", ["push", remote, "main"], { stdio: "inherit", cwd: root });
process.exit(r.status ?? 1);
