import { test, expect } from "@playwright/test";
import {
  bootstrapUser,
  openWebSession,
  waitForApiHealth,
  waitForWebReady,
} from "./helpers/web-session";

test("empty chat input shows localized content required message", async ({
  page,
  request,
}) => {
  await waitForApiHealth(request);
  const { token, userId } = await bootstrapUser(request);

  await openWebSession(page, { token, userId, characterId: null });
  await waitForWebReady(page);

  await page.locator("#input").fill("   ");
  await page.locator("#composer button[type=submit]").click();

  const assistant = page.locator(".bubble.assistant").last();
  await expect(assistant).toContainText(/內容|content/i, { timeout: 15_000 });
  await expect(assistant).not.toContainText("content_required");
});
