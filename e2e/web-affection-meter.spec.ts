import { test, expect } from "@playwright/test";
import {
  bootstrapUser,
  openWebSession,
  waitForApiHealth,
  waitForWebReady,
} from "./helpers/web-session";

test("web chat shows affection meter after reply", async ({ page, request }) => {
  await waitForApiHealth(request);
  const { token, userId } = await bootstrapUser(request);

  await openWebSession(page, { token, userId, characterId: null });
  await waitForWebReady(page);

  const panel = page.locator("#affectionPanel");

  await page.locator("#input").fill(`e2e-affection-${Date.now()}`);
  await page.locator("#composer").getByRole("button", { name: "送出" }).click();
  await expect(page.locator(".bubble.typing")).toHaveCount(0, {
    timeout: 20_000,
  });

  await expect(panel).toBeVisible({ timeout: 5_000 });
  await expect(page.locator("#stageLabel")).not.toBeEmpty();
  await expect(page.locator("#affectionPercent")).toContainText("%");
});
