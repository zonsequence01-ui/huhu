/**

 * Start API on a free port, run smoke-public-api, then exit.

 * Usage: pnpm smoke:api:local

 */

import { spawn } from "node:child_process";

import { createServer } from "node:net";

import { dirname, join } from "node:path";

import { fileURLToPath } from "node:url";



const root = join(dirname(fileURLToPath(import.meta.url)), "..");



function getFreePort() {

  return new Promise((resolve, reject) => {

    const s = createServer();

    s.once("error", reject);

    s.listen(0, "127.0.0.1", () => {

      const addr = s.address();

      const port = typeof addr === "object" && addr ? addr.port : 0;

      s.close((err) => (err ? reject(err) : resolve(port)));

    });

  });

}



const port =

  process.env.SMOKE_PORT != null && process.env.SMOKE_PORT !== ""

    ? Number(process.env.SMOKE_PORT)

    : await getFreePort();

const base = `http://127.0.0.1:${port}`;



const apiCmd =
  process.platform === "win32"
    ? "pnpm --filter @huhu/api exec tsx src/index.ts"
    : null;

const api = apiCmd
  ? spawn(apiCmd, [], {
      cwd: join(root, "apps/api"),
      env: {
        ...process.env,
        NODE_ENV: "test",
        PORT: String(port),
        HOST: "127.0.0.1",
        DATABASE_URL: "file:./data/smoke.db",
        JWT_SECRET: "smoke-test-secret",
        LLM_PROVIDER: "mock",
        EMBEDDING_PROVIDER: "mock",
        VECTOR_STORE: "sqlite",
        AGE_GATE: "0",
      },
      stdio: "ignore",
      shell: true,
    })
  : spawn("pnpm", ["--filter", "@huhu/api", "exec", "tsx", "src/index.ts"], {
      cwd: join(root, "apps/api"),
      env: {
        ...process.env,
        NODE_ENV: "test",
        PORT: String(port),
        HOST: "127.0.0.1",
        DATABASE_URL: "file:./data/smoke.db",
        JWT_SECRET: "smoke-test-secret",
        LLM_PROVIDER: "mock",
        EMBEDDING_PROVIDER: "mock",
        VECTOR_STORE: "sqlite",
        AGE_GATE: "0",
      },
      stdio: "ignore",
    });



async function waitHealth() {

  for (let i = 0; i < 40; i++) {

    try {

      const res = await fetch(`${base}/health`);

      if (!res.ok) continue;

      const body = await res.json();

      if (body?.status === "ok" && body?.bundleId === "com.ctrlz.huhu") {

        return;

      }

    } catch {

      /* retry */

    }

    await new Promise((r) => setTimeout(r, 500));

  }

  throw new Error("API did not become healthy");

}



let exitCode = 1;

try {

  await waitHealth();

  const smoke = spawn(process.execPath, [join(root, "scripts/smoke-public-api.mjs")], {
    cwd: root,
    env: { ...process.env, SMOKE_BASE_URL: base },
    stdio: "inherit",
  });

  exitCode = await new Promise((resolve) => {

    smoke.on("close", (code) => resolve(code ?? 1));

  });

} finally {

  api.kill("SIGTERM");

}



process.exit(exitCode);

