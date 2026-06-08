import { test, expect } from "@playwright/test";
import {
  bootstrapUser,
  openWebSession,
  waitForApiHealth,
  waitForWebReady,
} from "./helpers/web-session";

test("voice chat without subscription shows localized error", async ({
  page,
  request,
}) => {
  await waitForApiHealth(request);
  const { token, userId } = await bootstrapUser(request);

  await openWebSession(page, { token, userId, characterId: null });
  await waitForWebReady(page);

  await page.locator("#voiceToggle").click();
  await page.locator("#input").fill("測試語音");
  await page.locator("#composer button[type=submit]").click();

  const assistant = page.locator(".bubble.assistant").last();
  await expect(assistant).toContainText(/基礎|Basic/i, { timeout: 15_000 });
  await expect(assistant).not.toContainText("voice_requires_basic_subscription");
});
