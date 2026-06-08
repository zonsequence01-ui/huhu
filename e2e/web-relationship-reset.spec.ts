import { test, expect } from "@playwright/test";
import {
  bootstrapUser,
  openWebSession,
  waitForApiHealth,
  waitForWebReady,
} from "./helpers/web-session";

test("web privacy dialog resets relationship to stranger", async ({
  page,
  request,
}) => {
  page.on("dialog", (dialog) => dialog.accept());

  await waitForApiHealth(request);
  const { token, userId } = await bootstrapUser(request);

  await openWebSession(page, { token, userId, characterId: null });
  await waitForWebReady(page);
  await expect(page.locator("#affectionPanel")).toBeVisible({ timeout: 30_000 });

  const marker = `e2e-rel-reset-${Date.now()}`;
  await page.locator("#input").fill(marker);
  await page.locator("#composer").getByRole("button", { name: "送出" }).click();
  await expect(page.locator(".bubble.typing")).toHaveCount(0, {
    timeout: 20_000,
  });

  const resetResponse = page.waitForResponse(
    (res) =>
      res.request().method() === "POST" &&
      /\/v1\/characters\/[^/]+\/relationship\/reset$/.test(res.url()),
  );

  await page.locator("#privacyBtn").click();
  await page.locator("#privacyResetBtn").click();
  const res = await resetResponse;
  expect(res.ok()).toBeTruthy();

  await expect(
    page.getByText(/好感度已重置|Affection reset/),
  ).toBeVisible({ timeout: 10_000 });
  await expect(page.locator("#stageLabel")).toHaveText(/陌生人|Stranger/i);
});
