import { test, expect } from "@playwright/test";
import {
  bootstrapUser,
  openWebSession,
  waitForApiHealth,
  waitForWebReady,
} from "./helpers/web-session";

test("web chat shows typing indicator while awaiting reply", async ({
  page,
  request,
}) => {
  await waitForApiHealth(request);
  const { token, userId } = await bootstrapUser(request);

  await openWebSession(page, { token, userId, characterId: null });
  await waitForWebReady(page);

  await page.route("**/v1/chat", async (route) => {
    await new Promise((r) => setTimeout(r, 400));
    await route.continue();
  });

  const input = page.locator("#input");
  await input.fill(`e2e-typing-${Date.now()}`);
  await page.locator("#composer").getByRole("button", { name: "送出" }).click();

  await expect(page.locator(".bubble.typing")).toHaveCount(1, {
    timeout: 5_000,
  });
  await expect(page.locator(".bubble.typing")).toHaveCount(0, {
    timeout: 20_000,
  });
});
