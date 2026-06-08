/**
 * Set Cloudflare Pages secret API_ORIGIN for huhu-app (Phase 2 proxy).
 * Usage:
 *   pnpm set:pages-api-origin -- https://huhu-api.onrender.com
 *   echo https://your-api.example.com | pnpm set:pages-api-origin
 */
import { spawnSync } from "node:child_process";

const args = process.argv.slice(2).filter((a) => !a.startsWith("--project="));
const projectArg = process.argv.find((a) => a.startsWith("--project="));
const projectName = projectArg?.split("=")[1] ?? "huhu-app";

let origin = args.find((a) => a.startsWith("http"));
if (!origin) {
  console.error("Usage: pnpm set:pages-api-origin -- https://your-api-host");
  process.exit(1);
}

origin = origin.replace(/\/$/, "");
try {
  new URL(origin);
} catch {
  console.error("Invalid URL:", origin);
  process.exit(1);
}

console.log(`Setting API_ORIGIN=${origin} on Pages project "${projectName}"…`);

const r = spawnSync(
  "npx",
  ["wrangler", "pages", "secret", "put", "API_ORIGIN", "--project-name", projectName],
  { input: `${origin}\n`, stdio: ["pipe", "inherit", "inherit"], shell: true },
);

if (r.status !== 0) process.exit(r.status ?? 1);

console.log("\nRedeploy Pages so Functions pick up the secret:");
console.log("  pnpm deploy:pages");
console.log("\nVerify:");
console.log(`  curl -s ${origin.replace(/\/$/, "")}/health`);
console.log("  CHECK_SITE_REQUIRE_HEALTH=1 pnpm check:site");
console.log("  pnpm smoke:api:prod");
