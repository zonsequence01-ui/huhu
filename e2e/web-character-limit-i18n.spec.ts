import { test, expect } from "@playwright/test";
import {
  bootstrapUser,
  openWebSession,
  waitForApiHealth,
  waitForWebReady,
} from "./helpers/web-session";

test("character limit shows localized error in creator dialog", async ({
  page,
  request,
}) => {
  await waitForApiHealth(request);
  const { token, userId } = await bootstrapUser(request);
  const headers = { Authorization: `Bearer ${token}` };

  let firstCharacterId = "";
  for (let i = 0; i < 3; i++) {
    const created = await request.post("/v1/characters", {
      headers,
      data: {
        name: `WebLimit${i}`,
        personality: "warm",
        backstory: "test",
        speakingStyle: "casual",
      },
    });
    expect(created.ok()).toBeTruthy();
    const body = (await created.json()) as { characterId: string };
    if (i === 0) firstCharacterId = body.characterId;
  }

  await openWebSession(page, { token, userId, characterId: firstCharacterId });
  await waitForWebReady(page);

  await page.locator("#createCharBtn").click();
  await page.locator('#creatorForm input[name="name"]').fill("WebLimitOver");
  await page.locator('#creatorForm input[name="personality"]').fill("warm");
  await page.locator('#creatorForm textarea[name="backstory"]').fill("test");
  await page.locator('#creatorForm input[name="speakingStyle"]').fill("casual");

  const dialogPromise = new Promise<string>((resolve) => {
    page.once("dialog", async (dialog) => {
      resolve(dialog.message());
      await dialog.accept();
    });
  });
  await page.locator('#creatorForm button[value="ok"]').click();

  const message = await dialogPromise;
  expect(message).toMatch(/角色|上限|Characters/i);
  expect(message).not.toContain("character_limit_reached");
});
