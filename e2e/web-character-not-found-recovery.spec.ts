import { test, expect } from "@playwright/test";
import {
  bootstrapUser,
  openWebSession,
  waitForApiHealth,
  waitForWebReady,
} from "./helpers/web-session";

test("recovers from stale characterId without connection failure", async ({
  page,
  request,
}) => {
  await waitForApiHealth(request);
  const { token, userId } = await bootstrapUser(request);

  const presetRes = await request.get(
    "/v1/meta/default-character?locale=zh-TW",
  );
  expect(presetRes.ok()).toBeTruthy();
  const preset = (await presetRes.json()) as {
    presetId: string;
    locale: string;
  };

  const createRes = await request.post("/v1/characters/from-preset", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    data: {
      presetId: preset.presetId,
      locale: preset.locale,
    },
  });
  expect(createRes.ok()).toBeTruthy();
  const { characterId: realId } = (await createRes.json()) as {
    characterId: string;
  };

  const bogusId = "00000000-0000-4000-8000-000000000000";
  await openWebSession(page, { token, userId, characterId: bogusId });
  await waitForWebReady(page);

  await expect(page.locator("#characterSelect")).toHaveValue(realId);
  await expect(
    page.locator(".bubble.assistant", {
      hasText: /連線失敗|Connection failed/i,
    }),
  ).toHaveCount(0);
});
