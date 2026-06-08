/**
 * Start local production API (Docker) + Cloudflare quick tunnel for Pages proxy.
 * Usage:
 *   pnpm start:prod-stack
 *   pnpm start:prod-stack -- --sync-pages   # also set Pages API_ORIGIN + redeploy hint
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as sleep } from "node:timers/promises";
import { randomBytes } from "node:crypto";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(root, ".env");
const statePath = join(root, "dist/prod-stack-state.json");
const tunnelContainer = "huhu-cloudflared-tunnel";
const apiContainer = "huhu-api-prod";
const syncPages = process.argv.includes("--sync-pages");

function run(cmd, args, opts = {}) {
  return spawnSync(cmd, args, {
    cwd: root,
    shell: true,
    encoding: "utf8",
    stdio: opts.inherit ? "inherit" : "pipe",
    ...opts,
  });
}

function fail(msg) {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

function ensureEnv() {
  if (!existsSync(envPath)) {
    const example = join(root, ".env.example");
    if (existsSync(example)) {
      writeFileSync(envPath, readFileSync(example, "utf8"), "utf8");
      console.log("Created .env from .env.example");
    } else {
      fail("missing .env — run pnpm generate:jwt-secret and create .env");
    }
  }
  let env = readFileSync(envPath, "utf8");
  if (/^JWT_SECRET=change-me-in-production\s*$/m.test(env)) {
    const secret = randomBytes(32).toString("base64url");
    env = env.replace(/^JWT_SECRET=.*$/m, `JWT_SECRET=${secret}`);
    writeFileSync(envPath, env, "utf8");
    console.log("✓ generated JWT_SECRET in .env");
  }
  if (!/^STORE_PUBLIC_SITE_URL=/m.test(env)) {
    env += "\nSTORE_PUBLIC_SITE_URL=https://huhu-app.pages.dev\n";
    writeFileSync(envPath, env, "utf8");
  }
}

function port3000Listener() {
  const r = run("netstat", ["-ano"], { stdio: "pipe" });
  const lines = (r.stdout ?? "").split(/\r?\n/);
  for (const line of lines) {
    if (line.includes("LISTENING") && line.includes(":3000")) {
      const parts = line.trim().split(/\s+/);
      return parts[parts.length - 1];
    }
  }
  return null;
}

async function waitHealth(base, attempts = 30) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(`${base}/health`);
      if (res.ok) return true;
    } catch {
      /* retry */
    }
    await sleep(1000);
  }
  return false;
}

function dockerRunning(name) {
  const r = run("docker", ["inspect", "-f", "{{.State.Running}}", name], { shell: false });
  return r.status === 0 && (r.stdout ?? "").trim() === "true";
}

function listRunningCloudflared() {
  const r = run(
    "docker",
    ["ps", "--filter", "ancestor=cloudflare/cloudflared:latest", "--format", "{{.Names}}"],
    { shell: false },
  );
  return (r.stdout ?? "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function tunnelUrlFromContainer(name) {
  const logs = run("docker", ["logs", name], { shell: false });
  return parseTunnelUrl(logs.stdout ?? "") ?? parseTunnelUrl(logs.stderr ?? "");
}

function parseTunnelUrl(logs) {
  const m = logs.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
  return m?.[0] ?? null;
}

function ensureApi() {
  const pid = port3000Listener();
  if (pid) {
    console.log(`✓ port 3000 in use (PID ${pid}) — assuming API already running`);
    return "http://127.0.0.1:3000";
  }

  console.log("Starting production API container…");
  run("docker", ["rm", "-f", apiContainer], { stdio: "ignore" });

  const jwt = readFileSync(envPath, "utf8").match(/^JWT_SECRET=(.+)$/m)?.[1]?.trim();
  if (!jwt) fail("JWT_SECRET missing in .env");

  const start = run("docker", [
    "run",
    "-d",
    "--name",
    apiContainer,
    "-p",
    "3000:3000",
    "-e",
    `JWT_SECRET=${jwt}`,
    "-e",
    "NODE_ENV=production",
    "-e",
    "STORE_PUBLIC_SITE_URL=https://huhu-app.pages.dev",
    "-v",
    "huhu-data:/app/data",
    "huhu-api:local",
  ]);
  if (start.status !== 0) {
    console.log("Image huhu-api:local missing — building…");
    const build = run("docker", ["build", "-t", "huhu-api:local", "."], { inherit: true });
    if (build.status !== 0) fail("docker build failed");
    const retry = run("docker", [
      "run",
      "-d",
      "--name",
      apiContainer,
      "-p",
      "3000:3000",
      "-e",
      `JWT_SECRET=${jwt}`,
      "-e",
      "NODE_ENV=production",
      "-e",
      "STORE_PUBLIC_SITE_URL=https://huhu-app.pages.dev",
      "-v",
      "huhu-data:/app/data",
      "huhu-api:local",
    ]);
    if (retry.status !== 0) fail("docker run api failed");
  }
  console.log(`✓ container ${apiContainer} started`);
  return "http://127.0.0.1:3000";
}

async function ensureTunnel() {
  const existing = listRunningCloudflared();
  const reuse = existing.find((n) => n === tunnelContainer) ?? existing[0];
  if (reuse) {
    let url = tunnelUrlFromContainer(reuse);
    if (!url) {
      for (let i = 0; i < 10; i++) {
        await sleep(2000);
        url = tunnelUrlFromContainer(reuse);
        if (url) break;
      }
    }
    if (url) {
      console.log(`✓ reusing cloudflared container ${reuse}`);
      console.log(`✓ tunnel URL: ${url}`);
      return { url, container: reuse };
    }
  }

  run("docker", ["rm", "-f", tunnelContainer], { stdio: "ignore", shell: false });
  const start = run(
    "docker",
    [
      "run",
      "-d",
      "--name",
      tunnelContainer,
      "--restart",
      "unless-stopped",
      "cloudflare/cloudflared:latest",
      "tunnel",
      "--url",
      "http://host.docker.internal:3000",
    ],
    { shell: false },
  );
  if (start.status !== 0) fail("cloudflared container failed to start");
  console.log(`✓ started ${tunnelContainer}`);
  await sleep(5000);

  let url = tunnelUrlFromContainer(tunnelContainer);
  if (!url) {
    for (let i = 0; i < 15; i++) {
      await sleep(2000);
      url = tunnelUrlFromContainer(tunnelContainer);
      if (url) break;
    }
  }
  if (!url) fail("could not parse trycloudflare URL from cloudflared logs");
  console.log(`✓ tunnel URL: ${url}`);
  return { url, container: tunnelContainer };
}

console.log("=== Local production stack ===\n");
ensureEnv();
const apiBase = ensureApi();
if (!(await waitHealth(apiBase))) fail(`${apiBase}/health not ready`);
console.log(`✓ ${apiBase}/health OK`);

const tunnel = await ensureTunnel();

mkdirSync(join(root, "dist"), { recursive: true });
const state = {
  updatedAt: new Date().toISOString(),
  apiBase,
  tunnelUrl: tunnel.url,
  tunnelContainer: tunnel.container,
  apiContainer,
};
writeFileSync(statePath, JSON.stringify(state, null, 2), "utf8");
console.log(`\n✓ state → ${statePath}`);

if (syncPages) {
  console.log("\nSyncing Pages API_ORIGIN…");
  const set = run("pnpm", ["set:pages-api-origin", "--", tunnel.url], { inherit: true });
  if (set.status !== 0) {
    console.error("✗ set:pages-api-origin failed (wrangler auth?)");
    console.error("  Manual: pnpm set:pages-api-origin --", tunnel.url);
  } else {
    console.log("Run: pnpm deploy:pages && CHECK_SITE_REQUIRE_HEALTH=1 pnpm check:site");
  }
} else {
  console.log("\nNext:");
  console.log(`  pnpm set:pages-api-origin -- ${tunnel.url}`);
  console.log("  pnpm deploy:pages");
  console.log("  CHECK_SITE_REQUIRE_HEALTH=1 pnpm check:site");
}

console.log("\nStack OK");
