/**
 * Capture ASO store screenshots from the Web UI (requires Chromium).
 * Usage:
 *   pnpm capture:aso-screenshots
 *   pnpm capture:aso-screenshots -- --market=jp
 *   pnpm capture:aso-screenshots -- --all
 */
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { STORE_MARKETS } from "@huhu/shared";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.env.ASO_CAPTURE_PORT ?? 3098);
const baseUrl = `http://127.0.0.1:${port}`;
const viewport = { width: 1284, height: 2778 };

const args = process.argv.slice(2);
const allMarkets = args.includes("--all");
const marketArg = args.find((a) => a.startsWith("--market="));
const markets = allMarkets
  ? STORE_MARKETS.map((m) => m.market)
  : [marketArg?.split("=")[1] ?? "tw"];

const SHOTS = [
  { file: "01-chat.png", setup: "chat" },
  { file: "02-modes.png", setup: "modes" },
  { file: "03-character-creator.png", setup: "creator" },
  { file: "04-diary.png", setup: "diary" },
  { file: "05-subscribe.png", setup: "subscribe" },
  { file: "06-privacy.png", setup: "privacy" },
];

async function waitForHealth(timeoutMs = 120_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${baseUrl}/health`);
      if (res.ok) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`API not ready at ${baseUrl}/health`);
}

function startServer() {
  return spawn(
    "pnpm",
    ["--filter", "@huhu/api", "exec", "tsx", "src/index.ts"],
    {
      cwd: root,
      shell: true,
      stdio: "pipe",
      env: {
        ...process.env,
        NODE_ENV: "test",
        PORT: String(port),
        HOST: "127.0.0.1",
        DATABASE_URL: "file:./data/aso-capture.db",
        JWT_SECRET: "aso-capture-secret",
        LLM_PROVIDER: "mock",
        EMBEDDING_PROVIDER: "mock",
        VECTOR_STORE: "sqlite",
        AGE_GATE: "0",
      },
    },
  );
}

function sampleName(locale) {
  if (locale.startsWith("ja")) return "ハル";
  if (locale.startsWith("ko")) return "하루";
  if (locale === "vi-VN") return "Huhu";
  if (locale === "zh-CN") return "小呼";
  return "小呼";
}

function sampleChat(locale) {
  if (locale.startsWith("ja")) return "今日は海辺を散歩したい気分だね";
  if (locale.startsWith("ko")) return "주말에 바다 산책이 좋겠어";
  if (locale === "vi-VN") return "Cuối tuần đi dạo biển nhé";
  if (locale === "zh-CN") return "周末一起去海边散步吧";
  if (locale === "en") return "Let's walk by the sea this weekend";
  return "週末一起去海邊散步吧";
}

async function bootstrapSession(request, locale) {
  const boot = await request.post(`${baseUrl}/v1/users/bootstrap`);
  if (!boot.ok()) throw new Error("bootstrap failed");
  const { token, userId } = await boot.json();
  await request.patch(`${baseUrl}/v1/users/me/locale`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { locale },
  });
  const char = await request.post(`${baseUrl}/v1/characters`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      name: sampleName(locale),
      personality: "gentle",
      backstory: "ASO capture",
      speakingStyle: "warm",
      locale,
    },
  });
  if (!char.ok()) throw new Error("create character failed");
  const { characterId } = await char.json();
  await request.post(`${baseUrl}/v1/chat`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      characterId,
      content: sampleChat(locale),
      mode: "simple",
    },
  });
  return { token, userId, characterId, locale };
}

async function preparePage(page, session) {
  await page.goto(`${baseUrl}/`);
  await page.evaluate(
    ({ token, userId, characterId, locale }) => {
      localStorage.setItem("huhu_token", token);
      localStorage.setItem("huhu_userId", userId);
      localStorage.setItem("huhu_characterId", characterId);
      localStorage.setItem("huhu_locale", locale);
    },
    session,
  );
  await page.reload();
  await page.locator("#input").waitFor({ state: "visible", timeout: 30_000 });
  await page.locator("#stats").waitFor({ state: "visible", timeout: 30_000 });
  await page.locator("#affectionPanel").waitFor({ state: "visible", timeout: 15_000 });
}

async function closeDialogs(page) {
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
}

async function captureSetup(page, setup) {
  await closeDialogs(page);
  if (setup === "chat") return;
  if (setup === "modes") {
    await page.locator("#mode").scrollIntoViewIfNeeded();
    return;
  }
  if (setup === "creator") {
    await page.locator("#createCharBtn").click();
    await page.locator("#creatorDialog").waitFor({ state: "visible" });
    return;
  }
  if (setup === "diary") {
    await page.locator("#diaryBtn").click();
    await page.locator("#diaryDialog").waitFor({ state: "visible" });
    return;
  }
  if (setup === "subscribe") {
    await page.locator("#subscribeBtn").click();
    await page.locator("#subscribeDialog").waitFor({ state: "visible" });
    return;
  }
  if (setup === "privacy") {
    await page.locator("#privacyBtn").click();
    await page.locator("#privacyDialog").waitFor({ state: "visible" });
    await page.locator("#memoryFragmentsSection").waitFor({ state: "visible" });
  }
}

async function captureMarket(market) {
  const meta = STORE_MARKETS.find((m) => m.market === market);
  if (!meta) throw new Error(`unknown market: ${market}`);
  const outDir = join(root, "dist/aso-screenshots", market);
  mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport });
  const session = await bootstrapSession(page.request, meta.locale);
  await preparePage(page, session);

  for (const shot of SHOTS) {
    await captureSetup(page, shot.setup);
    await page.waitForTimeout(300);
    await page.screenshot({
      path: join(outDir, shot.file),
      fullPage: false,
    });
    console.log(`wrote ${join(outDir, shot.file)}`);
  }

  await browser.close();
}

const reuseServer = process.env.ASO_CAPTURE_REUSE === "1";
let child = null;
let shuttingDown = false;

function attachExitHandler(proc) {
  proc.on("exit", (code) => {
    if (shuttingDown) return;
    if (code && code !== 0) {
      console.error(`API exited unexpectedly with code ${code}`);
    }
  });
}

async function ensureApiReady() {
  if (reuseServer) {
    await waitForHealth(5_000);
    return;
  }
  try {
    await waitForHealth(5_000);
    return;
  } catch {
    if (child) {
      shuttingDown = true;
      child.kill("SIGTERM");
      await new Promise((r) => setTimeout(r, 500));
    }
    shuttingDown = false;
    child = startServer();
    attachExitHandler(child);
    await waitForHealth();
  }
}

if (!reuseServer) {
  child = startServer();
  attachExitHandler(child);
}

try {
  await ensureApiReady();

  for (const market of markets) {
    await ensureApiReady();
    console.log(`\n=== ${market} ===`);
    await captureMarket(market);
  }
  console.log("\nDone. Upload PNG from dist/aso-screenshots/ per docs/ASO_SCREENSHOTS.md");
} finally {
  if (child) {
    shuttingDown = true;
    child.kill("SIGTERM");
  }
}
