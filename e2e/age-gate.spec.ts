import { test, expect } from "@playwright/test";
import {
  bootstrapUser,
  openWebSession,
  waitForApiHealth,
  waitForWebReady,
} from "./helpers/web-session";

async function bootstrapWithCharacter(request: import("@playwright/test").APIRequestContext) {
  const boot = await request.post("/v1/users/bootstrap");
  expect(boot.ok()).toBeTruthy();
  const { token } = (await boot.json()) as { token: string };
  const char = await request.post("/v1/characters", {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      name: "AgeGateTest",
      personality: "gentle",
      backstory: "e2e",
      speakingStyle: "casual",
    },
  });
  expect(char.ok()).toBeTruthy();
  const { characterId } = (await char.json()) as { characterId: string };
  return { token, characterId };
}

test("API blocks chat until age confirmed when AGE_GATE=1", async ({
  request,
}) => {
  const { token, characterId } = await bootstrapWithCharacter(request);

  const configRes = await request.get("/v1/meta/client-config?locale=zh-TW");
  const configBody = (await configRes.json()) as {
    config: { apiErrors: Record<string, string> };
  };
  const ageMsg = configBody.config.apiErrors.age_confirmation_required;
  expect(ageMsg.length).toBeGreaterThan(5);
  expect(ageMsg).toMatch(/年齡|18/);

  const chat = await request.post("/v1/chat", {
    headers: { Authorization: `Bearer ${token}` },
    data: { characterId, content: "hello", mode: "simple" },
  });
  expect(chat.status()).toBe(403);
  expect(
    ((await chat.json()) as { error: string }).error,
  ).toBe("age_confirmation_required");

  const year = new Date().getFullYear() - 25;
  const confirm = await request.post("/v1/users/me/age-confirm", {
    headers: { Authorization: `Bearer ${token}` },
    data: { birthYear: year },
  });
  expect(confirm.ok()).toBeTruthy();

  const chatAfter = await request.post("/v1/chat", {
    headers: { Authorization: `Bearer ${token}` },
    data: { characterId, content: "hello after confirm", mode: "simple" },
  });
  expect(chatAfter.ok()).toBeTruthy();
});

test("web shows age dialog then allows chat after confirm", async ({
  page,
  request,
}) => {
  await waitForApiHealth(request);
  const { token, userId } = await bootstrapUser(request);

  await openWebSession(page, { token, userId, characterId: null });

  const dialog = page.locator("#ageDialog");
  await expect(dialog).toHaveAttribute("open", "");
  await expect(dialog.locator("h2")).toContainText(/年齡|Age/i);

  const year = new Date().getFullYear() - 25;
  await page.locator('#ageForm input[name="birthYear"]').fill(String(year));
  await page.locator('#ageForm button[type="submit"]').click();
  await expect(dialog).not.toHaveAttribute("open", "");

  await waitForWebReady(page);
  await page.locator("#input").fill("年齡確認後測試");
  await page.locator("#composer button[type=submit]").click();
  await expect(page.locator(".bubble.assistant").last()).not.toContainText(
    "age_confirmation_required",
    { timeout: 20_000 },
  );
});
