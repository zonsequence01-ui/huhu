import { test, expect } from "@playwright/test";
import {
  bootstrapUser,
  openWebSession,
  waitForApiHealth,
  waitForWebReady,
} from "./helpers/web-session";

test("web privacy dialog clears all chat messages", async ({
  page,
  request,
}) => {
  page.on("dialog", (dialog) => dialog.accept());

  await waitForApiHealth(request);
  const { token, userId } = await bootstrapUser(request);

  await openWebSession(page, { token, userId, characterId: null });
  await waitForWebReady(page);

  const marker = `e2e-privacy-clear-${Date.now()}`;
  await page.locator("#input").fill(marker);
  await page.locator("#composer").getByRole("button", { name: "送出" }).click();
  await expect(page.locator(".bubble.typing")).toHaveCount(0, {
    timeout: 20_000,
  });
  await expect(page.getByText(marker)).toBeVisible({ timeout: 20_000 });

  const clearResponse = page.waitForResponse(
    (res) =>
      res.request().method() === "DELETE" &&
      /\/v1\/characters\/[^/]+\/messages$/.test(res.url()),
  );

  await page.locator("#privacyBtn").click();
  await page.locator("#privacyMessagesBtn").click();
  const res = await clearResponse;
  expect(res.ok()).toBeTruthy();

  await expect(page.getByText(marker)).toHaveCount(0);
  await expect(page.locator(".bubble.user")).toHaveCount(0);
  await expect(
    page.getByText(/對話紀錄已清除|Chat history cleared/),
  ).toBeVisible();
});
