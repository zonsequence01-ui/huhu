import { test, expect } from "@playwright/test";

test("basic subscription exposes memory and voice entitlements", async ({
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
      productId: "com.ctrlz.huhu.sub.basic",
      receipt: `dev_stub:basic-ent-${userId}`,
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
  expect(body.subscriptionTier).toBe("basic");
  expect(body.plan.entitlements.memoryRetrievalLimit).toBe(16);
  expect(body.plan.entitlements.maxReplyTokens).toBe(3000);
  expect(body.plan.entitlements.voice).toBe(true);
});
