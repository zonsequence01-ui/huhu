import { test, expect } from "@playwright/test";
import {
  bootstrapUser,
  openWebSession,
  waitForApiHealth,
  waitForWebReady,
} from "./helpers/web-session";

test("character creator alert shows localized validation_failed", async ({
  page,
  request,
}) => {
  await waitForApiHealth(request);

  const configRes = await request.get("/v1/meta/client-config?locale=zh-TW");
  const validationMsg = (
    (await configRes.json()) as {
      config: { apiErrors: Record<string, string> };
    }
  ).config.apiErrors.validation_failed;
  expect(validationMsg).toMatch(/格式|檢查/);

  const { token, userId } = await bootstrapUser(request);
  await openWebSession(page, { token, userId, characterId: null });
  await waitForWebReady(page);

  const dialogPromise = new Promise<string>((resolve) => {
    page.once("dialog", async (dialog) => {
      resolve(dialog.message());
      await dialog.accept();
    });
  });

  await page.locator("#createCharBtn").click();
  await page.locator("#creatorDialog").waitFor({ state: "visible" });
  await page.evaluate(() => {
    const form = document.getElementById("creatorForm") as HTMLFormElement | null;
    if (form) form.noValidate = true;
  });
  await page.locator("#creatorForm button[type=submit]").click();

  const alertText = await dialogPromise;
  expect(alertText).toBe(validationMsg);
  expect(alertText).not.toContain("validation_failed");
});
