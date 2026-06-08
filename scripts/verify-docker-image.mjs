/**
 * Build Docker image and smoke-test /health + static pages inside container.
 * Usage: pnpm verify:docker
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as sleep } from "node:timers/promises";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const image = "huhu-api:verify";
const container = `huhu-verify-${Date.now()}`;

function run(cmd, args, opts = {}) {
  return spawnSync(cmd, args, {
    cwd: root,
    shell: true,
    encoding: "utf8",
    ...opts,
  });
}

function cleanup() {
  spawnSync("docker", ["rm", "-f", container], { shell: true, stdio: "ignore" });
}

function fail(msg) {
  console.error(`✗ ${msg}`);
  cleanup();
  process.exit(1);
}

console.log("=== Docker image verify ===\n");

const build = run("docker", ["build", "-t", image, "."]);
if (build.status !== 0) {
  console.error(build.stdout ?? "");
  console.error(build.stderr ?? "");
  fail("docker build failed");
}
console.log("✓ docker build");

const start = run("docker", [
  "run",
  "-d",
  "--name",
  container,
  "-p",
  "0:3000",
  "-e",
  "JWT_SECRET=docker-verify-secret",
  "-e",
  "STORE_PUBLIC_SITE_URL=https://huhu-app.pages.dev",
  image,
]);
if (start.status !== 0) {
  console.error(start.stderr ?? "");
  fail("docker run failed");
}

const portOut = run("docker", ["port", container, "3000"]);
const portLine = (portOut.stdout ?? "").trim().split("\n").pop() ?? "";
const match = portLine.match(/:(\d+)$/);
if (!match) {
  fail(`could not parse mapped port from: ${portLine}`);
}
const port = match[1];
const base = `http://127.0.0.1:${port}`;
console.log(`✓ container ${container} on ${base}`);

let ready = false;
for (let i = 0; i < 30; i++) {
  try {
    const res = await fetch(`${base}/health`);
    if (res.ok) {
      ready = true;
      break;
    }
  } catch {
    /* retry */
  }
  await sleep(1000);
}
if (!ready) fail("container /health not ready within 30s");

const healthRes = await fetch(`${base}/health`);
const health = await healthRes.json();
if (!health?.security?.jwtSecretConfigured) {
  fail("/health security.jwtSecretConfigured is false");
}
console.log("✓ jwtSecretConfigured");

const smoke = run("node", ["scripts/smoke-public-api.mjs"], {
  env: { ...process.env, SMOKE_BASE_URL: base },
  stdio: "inherit",
});

cleanup();

if (smoke.status !== 0) {
  fail("smoke inside container failed");
}

console.log("\nDocker verify OK");
