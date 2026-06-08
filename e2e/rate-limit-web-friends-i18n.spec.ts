import { test, expect } from "@playwright/test";
import {
  bootstrapUser,
  openWebSession,
  waitForApiHealth,
} from "./helpers/web-session";

test("friends invite form alert shows localized rate_limited", async ({
  page,
  request,
}) => {
  await waitForApiHealth(request);

  const configRes = await request.get("/v1/meta/client-config?locale=zh-TW");
  const rateMsg = (
    (await configRes.json()) as {
      config: { apiErrors: Record<string, string> };
    }
  ).config.apiErrors.rate_limited;
  expect(rateMsg).toMatch(/頻繁|稍後/);

  const { token, userId } = await bootstrapUser(request);
  const headers = { Authorization: `Bearer ${token}` };

  const thirdInvite = await (async () => {
    const targets: { userId: string; inviteCode: string }[] = [];
    for (let i = 0; i < 3; i++) {
      const other = await request.post("/v1/users/bootstrap");
      const otherBody = (await other.json()) as { token: string; userId: string };
      const me = await request.get("/v1/users/me", {
        headers: { Authorization: `Bearer ${otherBody.token}` },
      });
      const row = (await me.json()) as { id: string; inviteCode: string };
      targets.push({
        userId: row.id ?? otherBody.userId,
        inviteCode: row.inviteCode,
      });
    }
    for (const { userId: targetUserId } of targets.slice(0, 2)) {
      const ok = await request.post("/v1/friends/request", {
        headers,
        data: { targetUserId },
      });
      expect([200, 201]).toContain(ok.status());
    }
    return targets[2].inviteCode;
  })();

  await openWebSession(page, { token, userId, characterId: null });

  await page.locator("#friendsBtn").waitFor({ state: "visible", timeout: 30_000 });

  const dialogPromise = new Promise<string>((resolve) => {
    page.once("dialog", async (dialog) => {
      resolve(dialog.message());
      await dialog.accept();
    });
  });

  await page.locator("#friendsBtn").click();
  await page.locator("#inviteCodeInput").waitFor({ state: "visible" });
  await page.locator("#inviteCodeInput").fill(thirdInvite);
  await page.locator("#friendsSendBtn").click();

  const alertText = await dialogPromise;
  expect(alertText).toBe(rateMsg);
  expect(alertText).not.toContain("rate_limited");
});
