import { test, expect } from "@playwright/test";
import {
  bootstrapUser,
  openWebSession,
  waitForApiHealth,
  waitForWebReady,
} from "./helpers/web-session";

test("chat privacy banner shows and can be dismissed", async ({
  page,
  request,
}) => {
  await waitForApiHealth(request);
  const { token, userId } = await bootstrapUser(request);

  await openWebSession(page, {
    token,
    userId,
    characterId: null,
    extraLocalStorage: { huhu_chat_privacy_dismissed: null },
  });
  await waitForWebReady(page);

  const banner = page.locator("#chatPrivacyBanner");
  await expect(banner).toBeVisible({ timeout: 15_000 });
  await expect(page.locator("#chatPrivacyText")).not.toBeEmpty();

  await page.locator("#chatPrivacyDismiss").click();
  await expect(banner).toBeHidden();

  const dismissed = await page.evaluate(() =>
    localStorage.getItem("huhu_chat_privacy_dismissed"),
  );
  expect(dismissed).toBe("1");
});
