import { test, expect } from "@playwright/test";

test("premium subscription exposes expanded plan entitlements", async ({
  request,
}) => {
  const boot = await request.post("/v1/users/bootstrap");
  const { token, userId } = (await boot.json()) as {
    token: string;
    userId: string;
  };
  const headers = { Authorization: `Bearer ${token}` };

  const iap = await request.post("/v1/iap/verify", {
    headers,
    data: {
      platform: "ios",
      productId: "com.ctrlz.huhu.sub.premium",
      receipt: `dev_stub:premium-e2e-${userId}`,
    },
  });
  expect(iap.ok()).toBeTruthy();

  const me = await request.get("/v1/users/me", { headers });
  expect(me.ok()).toBeTruthy();
  const body = (await me.json()) as {
    subscriptionTier: string;
    plan: {
      entitlements: {
        memoryRetrievalLimit: number;
        maxReplyTokens: number;
        voice: boolean;
      };
    };
  };
  expect(body.subscriptionTier).toBe("premium");
  expect(body.plan.entitlements.memoryRetrievalLimit).toBe(20);
  expect(body.plan.entitlements.maxReplyTokens).toBeGreaterThan(3000);
  expect(body.plan.entitlements.voice).toBe(true);
});
