import { test, expect } from "@playwright/test";

test("lite subscription grants monthly coins on first sync", async ({
  request,
}) => {
  const boot = await request.post("/v1/users/bootstrap");
  const { token, userId } = (await boot.json()) as {
    token: string;
    userId: string;
  };
  const headers = { Authorization: `Bearer ${token}` };

  const before = await request.get("/v1/users/me", { headers });
  const coinsBefore = ((await before.json()) as { coins: number }).coins;

  const iap = await request.post("/v1/iap/verify", {
    headers,
    data: {
      platform: "ios",
      productId: "com.ctrlz.huhu.sub.lite",
      receipt: `dev_stub:lite-monthly-${userId}`,
    },
  });
  expect(iap.ok()).toBeTruthy();

  const after = await request.get("/v1/users/me", { headers });
  const body = (await after.json()) as {
    coins: number;
    subscriptionTier: string;
  };
  expect(body.subscriptionTier).toBe("lite");
  expect(body.coins).toBeGreaterThanOrEqual(coinsBefore + 30);
});
