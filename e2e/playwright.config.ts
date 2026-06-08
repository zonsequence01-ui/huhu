import { defineConfig } from "@playwright/test";

const port = Number(process.env.E2E_PORT ?? 3099);
const agePort = Number(process.env.E2E_AGE_PORT ?? port + 1);
const rateLimitPort = Number(process.env.E2E_RL_PORT ?? port + 2);
const apiCmd = `pnpm --filter @huhu/api exec tsx src/index.ts`;
const apiCwd = `${process.cwd()}/apps/api`;

function apiServerEnv(
  listenPort: number,
  ageGate: "0" | "1",
  dbFile: string,
  extra: Record<string, string> = {},
): Record<string, string> {
  return {
    NODE_ENV: "test",
    PORT: String(listenPort),
    HOST: "127.0.0.1",
    DATABASE_URL: `file:./data/${dbFile}`,
    JWT_SECRET: "e2e-test-secret",
    LLM_PROVIDER: "mock",
    EMBEDDING_PROVIDER: "mock",
    VECTOR_STORE: "sqlite",
    AGE_GATE: ageGate,
    ...extra,
  };
}

export default defineConfig({
  testDir: ".",
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  projects: [
    {
      name: "default",
      testIgnore: [/age-gate/, /rate-limit/],
      use: { baseURL: `http://127.0.0.1:${port}` },
    },
    {
      name: "age-gate",
      testMatch: [/age-gate/],
      use: { baseURL: `http://127.0.0.1:${agePort}` },
    },
    {
      name: "rate-limit",
      testMatch: [/rate-limit/],
      use: { baseURL: `http://127.0.0.1:${rateLimitPort}` },
    },
  ],
  webServer: [
    {
      command: apiCmd,
      cwd: apiCwd,
      url: `http://127.0.0.1:${port}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: apiServerEnv(port, "0", "e2e.db"),
    },
    {
      command: apiCmd,
      cwd: apiCwd,
      url: `http://127.0.0.1:${agePort}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: apiServerEnv(agePort, "1", "e2e-age.db"),
    },
    {
      command: apiCmd,
      cwd: apiCwd,
      url: `http://127.0.0.1:${rateLimitPort}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: apiServerEnv(rateLimitPort, "0", "e2e-rl.db", {
        FRIEND_REQUEST_RATE_LIMIT: "2",
        USER_SEARCH_RATE_LIMIT: "2",
      }),
    },
  ],
});
