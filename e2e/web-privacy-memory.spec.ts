import { test, expect } from "@playwright/test";
import {
  bootstrapUser,
  openWebSession,
  waitForApiHealth,
  waitForWebReady,
} from "./helpers/web-session";

test("web privacy dialog lists and deletes a RAG memory fragment", async ({
  page,
  request,
}) => {
  page.on("dialog", (dialog) => dialog.accept());

  await waitForApiHealth(request);
  const { token, userId } = await bootstrapUser(request);

  await openWebSession(page, { token, userId, characterId: null });
  await waitForWebReady(page);

  const memoryLine = `我最喜歡週末去海邊散步看夕陽 e2e-${Date.now()}`;
  await page.locator("#input").fill(memoryLine);
  await page.locator("#composer").getByRole("button", { name: "送出" }).click();
  await expect(page.locator(".bubble.typing")).toHaveCount(0, {
    timeout: 20_000,
  });

  await page.locator("#privacyBtn").click();
  await expect(page.locator("#memoryFragmentsSection")).toBeVisible();
  const preview = page.locator("#memoryFragmentsList li").filter({
    hasText: /海邊|夕陽|週末/,
  });
  await expect(preview).toHaveCount(1, { timeout: 15_000 });

  const deleteResponse = page.waitForResponse(
    (res) =>
      res.request().method() === "DELETE" &&
      /\/v1\/characters\/[^/]+\/memories\/[^/]+$/.test(res.url()),
  );

  await preview.getByRole("button").click();
  const delRes = await deleteResponse;
  expect(delRes.ok()).toBeTruthy();

  await expect(
    page.getByText(/已刪除該記憶片段|Memory fragment deleted/),
  ).toBeVisible({ timeout: 10_000 });
  await expect(preview).toHaveCount(0);
});
