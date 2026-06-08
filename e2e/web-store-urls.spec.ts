import { test, expect } from "@playwright/test";
import {
  bootstrapUser,
  openWebSession,
  waitForApiHealth,
  waitForWebReady,
} from "./helpers/web-session";

test("web support and privacy dialogs expose client-config storeUrls", async ({
  page,
  request,
}) => {
  await waitForApiHealth(request);
  const configRes = await request.get("/v1/meta/client-config?locale=zh-TW");
  expect(configRes.ok()).toBeTruthy();
  const { config } = (await configRes.json()) as {
    config: { storeUrls: { support: string; privacy: string } };
  };
  const { support, privacy } = config.storeUrls;

  const { token, userId } = await bootstrapUser(request);
  await openWebSession(page, { token, userId, characterId: null });
  await waitForWebReady(page);

  await page.locator("#supportBtn").click();
  const supportDialog = page.locator("#supportDialog");
  await expect(supportDialog).toBeVisible();
  await expect(page.locator("#supportPageExternalLink")).toHaveAttribute(
    "href",
    support,
  );
  await expect(page.locator("#supportPrivacyExternalLink")).toHaveAttribute(
    "href",
    privacy,
  );
  await page.locator("#supportCloseBtn").click();
  await expect(supportDialog).not.toBeVisible();

  await page.locator("#privacyBtn").click();
  const privacyDialog = page.locator("#privacyDialog");
  await expect(privacyDialog).toBeVisible();
  await expect(page.locator("#privacyPolicyLink")).toHaveAttribute(
    "href",
    privacy,
  );
  await expect(page.locator("#supportPageLink")).toHaveAttribute("href", support);
  await page.locator("#privacyCloseBtn").click();
  await expect(privacyDialog).not.toBeVisible();
});
