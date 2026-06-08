import { test, expect } from "@playwright/test";
import {
  bootstrapUser,
  openWebSession,
  waitForApiHealth,
  waitForWebReady,
} from "./helpers/web-session";

test("web chat delete buttons work without reloading history", async ({
  page,
  request,
}) => {
  page.on("dialog", (dialog) => dialog.accept());

  await waitForApiHealth(request);
  const { token, userId } = await bootstrapUser(request);

  await openWebSession(page, { token, userId, characterId: null });
  await waitForWebReady(page);

  const input = page.locator("#input");
  const unique = `e2e-delete-${Date.now()}`;
  await input.fill(unique);
  await page.locator("#composer").getByRole("button", { name: "送出" }).click();

  await expect(page.locator(".bubble.typing")).toHaveCount(0, {
    timeout: 20_000,
  });
  await expect(page.getByText("（unauthorized）")).toHaveCount(0);

  const userBubble = page.locator(".bubble.user").filter({ hasText: unique });
  await expect(userBubble).toBeVisible({ timeout: 20_000 });
  await expect(userBubble.locator(".bubble-delete")).toBeVisible({
    timeout: 10_000,
  });

  await page.evaluate(() => {
    window.confirm = () => true;
  });
  const deleteResponse = page.waitForResponse(
    (res) =>
      res.request().method() === "DELETE" &&
      /\/v1\/characters\/[^/]+\/messages\/[^/]+$/.test(res.url()),
  );
  await userBubble.locator(".bubble-delete").click();
  const res = await deleteResponse;
  expect(res.ok()).toBeTruthy();
  await expect(userBubble).toHaveCount(0);

  const assistantBubble = page
    .locator(".bubble.assistant:not(.typing)")
    .last();
  await expect(assistantBubble).toBeVisible();
  await expect(assistantBubble.locator(".bubble-delete")).toBeVisible();
});
