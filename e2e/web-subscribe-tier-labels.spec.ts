import { test, expect } from "@playwright/test";
import {
  bootstrapUser,
  openWebSession,
  waitForApiHealth,
  waitForWebReady,
} from "./helpers/web-session";

test("subscribe dialog shows localized tier entitlement labels", async ({
  page,
  request,
}) => {
  await waitForApiHealth(request);
  const { token, userId } = await bootstrapUser(request);

  await openWebSession(page, { token, userId, characterId: null });
  await waitForWebReady(page);

  const liteLabel = page.locator('.tier-label[data-tier="lite"]');
  await expect(liteLabel).toContainText(/輕量|Lite/i, { timeout: 15_000 });
  await expect(liteLabel).not.toHaveText(/^Lite$/);
  await page.locator("#subscribeBtn").click();

  const basicLabel = page.locator('.tier-label[data-tier="basic"]');
  await expect(basicLabel).toBeVisible({ timeout: 15_000 });
  await expect(basicLabel).toContainText(/語音|voice/i);
  await expect(basicLabel).toContainText(/基礎|Basic/i);
  await expect(basicLabel).not.toContainText("basic ·");
  await expect(page.locator("#subscribeTiersPrompt")).toContainText(/基礎|尊榮/);
});

test("subscribe dialog refreshes tier labels after locale switch", async ({
  page,
  request,
}) => {
  await waitForApiHealth(request);
  const { token, userId } = await bootstrapUser(request);

  await openWebSession(page, { token, userId, characterId: null });
  await waitForWebReady(page);

  await page.locator("#localeSelect").waitFor({ state: "visible" });
  await page.locator("#localeSelect").selectOption("ja-JP");
  await page.locator("#subscribeBtn").click();
  const basicLabel = page.locator('.tier-label[data-tier="basic"]');
  await expect(basicLabel).toContainText(/ベーシック/);
  await expect(page.locator("#subscribeTiersPrompt")).toContainText(
    /ベーシック|プレミアム/,
  );
});
