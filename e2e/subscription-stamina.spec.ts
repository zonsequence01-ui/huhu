import { test, expect } from "@playwright/test";

test("IAP lite subscription grants unlimited stamina", async ({ request }) => {
  const boot = await request.post("/v1/users/bootstrap");
  expect(boot.ok()).toBeTruthy();
  const { token, userId } = (await boot.json()) as {
    token: string;
    userId: string;
  };

  const freeMe = await request.get("/v1/users/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(freeMe.ok()).toBeTruthy();
  const freeBody = (await freeMe.json()) as {
    subscriptionTier: string;
    staminaDisplay: { unlimited: boolean };
    plan: { entitlements: { unlimitedStamina: boolean } };
  };
  expect(freeBody.subscriptionTier).toBe("free");
  expect(freeBody.staminaDisplay.unlimited).toBe(false);
  expect(freeBody.plan.entitlements.unlimitedStamina).toBe(false);

  const catalog = await request.get("/v1/meta/iap-products");
  expect(catalog.ok()).toBeTruthy();
  const { subscriptions } = (await catalog.json()) as {
    subscriptions: { tier: string; productId: string }[];
  };
  const liteProduct = subscriptions.find((s) => s.tier === "lite");
  expect(liteProduct?.productId).toBeTruthy();

  const iap = await request.post("/v1/iap/verify", {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      platform: "web",
      productId: liteProduct!.productId,
      receipt: `valid_${liteProduct!.productId}`,
      transactionId: `dev_stub:lite-stamina-${userId}`,
    },
  });
  expect(iap.ok()).toBeTruthy();

  const liteMe = await request.get("/v1/users/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(liteMe.ok()).toBeTruthy();
  const liteBody = (await liteMe.json()) as {
    subscriptionTier: string;
    staminaDisplay: { unlimited: boolean };
    plan: { entitlements: { unlimitedStamina: boolean } };
  };
  expect(liteBody.subscriptionTier).toBe("lite");
  expect(liteBody.staminaDisplay.unlimited).toBe(true);
  expect(liteBody.plan.entitlements.unlimitedStamina).toBe(true);
});
