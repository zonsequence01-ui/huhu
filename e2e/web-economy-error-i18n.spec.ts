import { test, expect } from "@playwright/test";
import {
  bootstrapUser,
  openWebSession,
  verifyCharacterOwned,
  waitForApiHealth,
  waitForWebReady,
} from "./helpers/web-session";

test("insufficient coins shows localized error in chat", async ({
  page,
  request,
}) => {
  await waitForApiHealth(request);
  const { token, userId } = await bootstrapUser(request);
  const headers = { Authorization: `Bearer ${token}` };

  const char = await request.post("/v1/characters", {
    headers,
    data: {
      name: "CoinsE2E",
      personality: "warm",
      backstory: "test",
      speakingStyle: "casual",
    },
  });
  expect(char.ok()).toBeTruthy();
  const { characterId } = (await char.json()) as { characterId: string };
  await verifyCharacterOwned(request, token, characterId);

  for (let i = 0; i < 2; i++) {
    const res = await request.post("/v1/chat", {
      headers,
      data: {
        characterId,
        content: `心動鋪陳 ${i}`,
        mode: "exciting",
      },
    });
    expect(res.ok()).toBeTruthy();
  }

  await openWebSession(page, { token, userId, characterId });
  await waitForWebReady(page);

  await page.locator("#mode").selectOption("exciting");
  await page.locator("#input").fill("心動測試 沒幣");
  await page.locator("#composer button[type=submit]").click();

  const assistant = page.locator(".bubble.assistant").last();
  await expect(assistant).toContainText(/呼呼幣|Coins/i, { timeout: 15_000 });
  await expect(assistant).not.toContainText("insufficient_coins");
});

test("insufficient stamina shows localized error in chat", async ({
  page,
  request,
}) => {
  await waitForApiHealth(request);
  const { token, userId } = await bootstrapUser(request);
  const headers = { Authorization: `Bearer ${token}` };

  const char = await request.post("/v1/characters", {
    headers,
    data: {
      name: "StaminaE2E",
      personality: "warm",
      backstory: "test",
      speakingStyle: "casual",
    },
  });
  expect(char.ok()).toBeTruthy();
  const { characterId } = (await char.json()) as { characterId: string };
  await verifyCharacterOwned(request, token, characterId);

  const drain = await request.patch("/v1/users/me/dev-economy", {
    headers,
    data: { stamina: 0 },
  });
  expect(drain.ok()).toBeTruthy();

  await openWebSession(page, { token, userId, characterId });
  await waitForWebReady(page);

  await page.locator("#input").fill("體力耗盡測試");
  await page.locator("#composer button[type=submit]").click();

  const assistant = page.locator(".bubble.assistant").last();
  await expect(assistant).toContainText(/體力|stamina/i, { timeout: 15_000 });
  await expect(assistant).not.toContainText("insufficient_stamina");
});
