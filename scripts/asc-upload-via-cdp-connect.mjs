import { chromium } from "@playwright/test";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "dist/iap-review-screenshots");
const endpoints = ["http://127.0.0.1:9222", "http://127.0.0.1:9223", "http://localhost:9222"];

let browser;
for (const endpoint of endpoints) {
  try {
    browser = await chromium.connectOverCDP(endpoint);
    console.log("Connected CDP:", endpoint);
    break;
  } catch (e) {
    console.log("CDP fail", endpoint, e.message);
  }
}
if (!browser) {
  console.error("No CDP endpoint. Use chunked MCP upload instead.");
  process.exit(1);
}

const page = browser.contexts()[0]?.pages().find((p) => p.url().includes("appstoreconnect")) ?? browser.contexts()[0]?.pages()[0];
if (!page) {
  console.error("No ASC page in CDP browser");
  process.exit(1);
}
console.log("Page:", page.url());

await page.evaluate(() => {
  window.__iapB64 = "";
});
for (let i = 0; i < 11; i++) {
  const { expression } = JSON.parse(readFileSync(join(dir, `cdp-chunk-${i}.json`), "utf8"));
  const len = await page.evaluate(expression);
  console.log("chunk", i, "len", len);
}

const finalize = JSON.parse(readFileSync(join(dir, "cdp-finalize.json"), "utf8"));
const result = await page.evaluate(finalize.expression);
console.log("finalize", result);

const save = page.getByRole("button", { name: "Save" });
if (await save.isVisible().catch(() => false)) {
  await save.click();
  await page.waitForTimeout(2000);
}
await browser.close();
