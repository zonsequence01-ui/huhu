/**
 * Deploy store static pages (privacy/support) to Cloudflare Pages.
 * Requires CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID (default from wrangler config).
 *
 * Usage:
 *   CLOUDFLARE_API_TOKEN=... pnpm deploy:pages
 *   CLOUDFLARE_API_TOKEN=... pnpm deploy:pages -- --project=huhu-app
 */
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const staticDir = join(root, "dist/cf-static");
const projectArg = process.argv.find((a) => a.startsWith("--project="));
const projectName = projectArg?.split("=")[1] ?? "huhu-app";
const accountId =
  process.env.CLOUDFLARE_ACCOUNT_ID ?? "f7b64a1d422a7871db862ea203265c39";

mkdirSync(staticDir, { recursive: true });
const privacyDir = join(staticDir, "privacy");
const supportDir = join(staticDir, "support");
mkdirSync(privacyDir, { recursive: true });
mkdirSync(supportDir, { recursive: true });
for (const [srcName, destPath] of [
  ["privacy.html", join(privacyDir, "index.html")],
  ["support.html", join(supportDir, "index.html")],
  ["privacy.html", join(staticDir, "privacy.html")],
  ["support.html", join(staticDir, "support.html")],
]) {
  const src = join(root, "apps/web", srcName);
  if (!existsSync(src)) {
    console.error(`Missing ${src}`);
    process.exit(1);
  }
  cpSync(src, destPath);
}
const cfFunctions = join(root, "apps/web/cf-functions");
const functionsOut = join(staticDir, "functions");
const rootFunctions = join(root, "functions");
if (existsSync(cfFunctions)) {
  cpSync(cfFunctions, functionsOut, { recursive: true });
  rmSync(rootFunctions, { recursive: true, force: true });
  cpSync(cfFunctions, rootFunctions, { recursive: true });
}
writeFileSync(
  join(staticDir, "_redirects"),
  "/privacy /privacy/ 301\n/support /support/ 301\n",
);

if (!process.env.CLOUDFLARE_API_TOKEN) {
  console.log(
    "No CLOUDFLARE_API_TOKEN — using wrangler OAuth login (run `npx wrangler login` if deploy fails).",
  );
}

console.log(`Deploying ${staticDir} → Pages project "${projectName}"…\n`);

const create = spawnSync(
  "npx",
  ["wrangler", "pages", "project", "create", projectName, "--production-branch=main"],
  {
    cwd: root,
    env: { ...process.env, CLOUDFLARE_ACCOUNT_ID: accountId },
    stdio: "pipe",
    shell: true,
    encoding: "utf8",
  },
);
if (create.status !== 0 && !/already exists|8000004/i.test(create.stderr ?? create.stdout ?? "")) {
  console.error(create.stderr ?? create.stdout);
}

const r = spawnSync(
  "npx",
  [
    "wrangler",
    "pages",
    "deploy",
    `--project-name=${projectName}`,
    "--commit-dirty=true",
  ],
  {
    cwd: root,
    env: { ...process.env, CLOUDFLARE_ACCOUNT_ID: accountId },
    stdio: "inherit",
    shell: true,
  },
);

if (r.status !== 0) process.exit(r.status ?? 1);

const siteUrl = `https://${projectName}.pages.dev`;
console.log(`\nDeployed. Verify:`);
console.log(`  curl -sI ${siteUrl}/privacy`);
console.log(`  curl -s ${siteUrl}/health   # 503 until API_ORIGIN is set`);
console.log(`\nPhase 2 — set Pages env API_ORIGIN to your API host (no trailing slash):`);
console.log(`  npx wrangler pages project list`);
console.log(`  # Render: pnpm deploy:render → copy https://huhu-api.onrender.com`);
console.log(`  # CF dashboard → Pages → ${projectName} → Settings → Environment variables → API_ORIGIN`);
console.log(`\nSet in repo / CI:`);
console.log(`  STORE_PUBLIC_SITE_URL=${siteUrl}`);
