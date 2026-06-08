import { test, expect } from "@playwright/test";
import {
  bootstrapUser,
  openWebSession,
  waitForApiHealth,
  waitForWebReady,
} from "./helpers/web-session";

test("privacy banner text updates when locale changes", async ({
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

  const textEl = page.locator("#chatPrivacyText");
  await expect(page.locator("#chatPrivacyBanner")).toBeVisible({
    timeout: 15_000,
  });

  const zhSnippet = await textEl.textContent();
  expect(zhSnippet?.length).toBeGreaterThan(10);

  await page.locator("#localeSelect").waitFor({ state: "visible" });
  await page.selectOption("#localeSelect", "en");
  await expect(textEl).toContainText("Avoid sharing", { timeout: 15_000 });
});
