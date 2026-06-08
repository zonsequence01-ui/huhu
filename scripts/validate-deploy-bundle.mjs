/**
 * Validate dist/deploy-bundle handoff folder.
 * Usage: pnpm validate:deploy-bundle
 */
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const bundle = join(root, "dist/deploy-bundle");

const required = [
  "DEPLOY.md",
  "deploy-remote.example.sh",
  "deploy-remote-static.example.sh",
  "manifest.json",
  "docker-compose.prod.yml",
  "docker-compose.static.yml",
  "docker-compose.yml",
  "Dockerfile",
  ".env.example",
  "infra/Caddyfile.example",
  "infra/Caddyfile.static.example",
  "web/privacy.html",
  "web/support.html",
];

let failed = false;

if (!existsSync(bundle)) {
  console.error(`Missing ${bundle}. Run: pnpm export:deploy-bundle`);
  process.exit(1);
}

for (const rel of required) {
  const p = join(bundle, rel);
  if (!existsSync(p)) {
    console.error(`✗ missing ${rel}`);
    failed = true;
  } else {
    console.log(`✓ ${rel}`);
  }
}

const deployMd = readFileSync(join(bundle, "DEPLOY.md"), "utf8");
if (!deployMd.includes("JWT_SECRET")) {
  console.error("✗ DEPLOY.md missing JWT_SECRET guidance");
  failed = true;
}

const compose = readFileSync(join(bundle, "docker-compose.prod.yml"), "utf8");
if (!compose.includes("JWT_SECRET")) {
  console.error("✗ docker-compose.prod.yml missing JWT_SECRET");
  failed = true;
}

const dockerfile = readFileSync(join(bundle, "Dockerfile"), "utf8");
if (!dockerfile.includes("apps/web")) {
  console.error("✗ Dockerfile must COPY apps/web (support/privacy + Web UI)");
  failed = true;
} else {
  console.log("✓ Dockerfile includes apps/web");
}

const remote = readFileSync(join(bundle, "deploy-remote.example.sh"), "utf8");
if (!remote.includes("docker-compose.prod.yml")) {
  console.error("✗ deploy-remote.example.sh missing compose reference");
  failed = true;
}

if (failed) process.exit(1);
console.log("Deploy bundle validation OK");
