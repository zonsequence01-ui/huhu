/**
 * Upload IAP review screenshot via Playwright setInputFiles (uses logged-in Chrome profile if available).
 * Usage: node scripts/asc-iap-upload-playwright.mjs [iapUrl] [pngPath]
 */
import { chromium } from "@playwright/test";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const iapUrl =
  process.argv[2] ??
  "https://appstoreconnect.apple.com/apps/6775517776/distribution/iaps/6777119400";
const pngPath =
  process.argv[3] ??
  join(root, "dist/iap-review-screenshots/com.ctrlz.huhu.coins.small.png");

if (!existsSync(pngPath)) {
  console.error("Missing PNG:", pngPath);
  process.exit(1);
}

const browser = await chromium.launch({
  headless: false,
  channel: "chrome",
});
const context = await browser.newContext();
const page = await context.newPage();
console.log("Navigate:", iapUrl);
await page.goto(iapUrl, { waitUntil: "domcontentloaded", timeout: 120000 });

try {
  await page.waitForSelector("#iap_review_info_undefined", { timeout: 120000 });
} catch {
  console.error("Login required or page not ready. Sign in to App Store Connect in the opened window, then re-run.");
  await page.waitForTimeout(300000);
}

await page.locator("#iap_review_info_undefined").setInputFiles(pngPath);
await page.waitForTimeout(2000);

const save = page.getByRole("button", { name: "Save" });
if (await save.isVisible()) {
  await save.click();
  await page.waitForTimeout(3000);
}

const status = await page.evaluate(() => ({
  files: document.getElementById("iap_review_info_undefined")?.files?.length ?? 0,
  bodySnippet: document.body.innerText.includes("Missing Metadata")
    ? "Missing Metadata"
    : document.body.innerText.match(/Prepare for Submission|Ready to Submit|Missing Metadata/)?.[0] ?? "unknown",
}));

console.log("Upload result:", status);
await browser.close();
