import { test, expect } from "@playwright/test";
import {
  bootstrapUser,
  openWebSession,
  waitForApiHealth,
  waitForWebReady,
} from "./helpers/web-session";

test("stats bar shows localized free plan tier", async ({ page, request }) => {
  await waitForApiHealth(request);
  const { token, userId } = await bootstrapUser(request);

  await openWebSession(page, { token, userId, characterId: null });
  await waitForWebReady(page);

  const stats = page.locator("#stats");
  await expect(stats).toContainText(/免費|Free/i);
  await expect(stats).not.toContainText(/plan free/i);
  await expect(stats).toContainText(/角色上限|Characters/i);

  const voiceTitle = await page.locator("#voiceToggle").getAttribute("title");
  expect(voiceTitle).toMatch(/基礎|Basic/i);
  expect(voiceTitle).not.toMatch(/Basic\+/);
});
