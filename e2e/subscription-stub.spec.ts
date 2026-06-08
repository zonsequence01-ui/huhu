import { test, expect } from "@playwright/test";

test("IAP basic subscription unlocks voice chat", async ({ request }) => {
  const boot = await request.post("/v1/users/bootstrap");
  expect(boot.ok()).toBeTruthy();
  const { token, userId } = (await boot.json()) as {
    token: string;
    userId: string;
  };

  const char = await request.post("/v1/characters", {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      name: "VoiceE2E",
      personality: "溫柔",
      backstory: "測試",
      speakingStyle: "口語",
    },
  });
  expect(char.ok()).toBeTruthy();
  const { characterId } = (await char.json()) as { characterId: string };

  const blocked = await request.post("/v1/chat", {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      characterId,
      content: "語音測試",
      mode: "simple",
      messageType: "voice",
    },
  });
  expect(blocked.status()).toBe(403);
  const blockedBody = (await blocked.json()) as { error: string };
  expect(blockedBody.error).toBe("voice_requires_basic_subscription");

  const catalog = await request.get("/v1/meta/iap-products");
  expect(catalog.ok()).toBeTruthy();
  const { subscriptions } = (await catalog.json()) as {
    subscriptions: { tier: string; productId: string }[];
  };
  const basicProduct = subscriptions.find((s) => s.tier === "basic");
  expect(basicProduct?.productId).toBeTruthy();

  const iap = await request.post("/v1/iap/verify", {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      platform: "web",
      productId: basicProduct!.productId,
      receipt: `valid_${basicProduct!.productId}`,
      transactionId: `dev_stub:basic-${userId}`,
    },
  });
  expect(iap.ok()).toBeTruthy();
  const iapBody = (await iap.json()) as {
    economy: { subscriptionTier: string };
  };
  expect(iapBody.economy.subscriptionTier).toBe("basic");

  const me = await request.get("/v1/users/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(me.ok()).toBeTruthy();
  const meBody = (await me.json()) as { subscriptionTier: string };
  expect(meBody.subscriptionTier).toBe("basic");

  const voice = await request.post("/v1/chat", {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      characterId,
      content: "語音測試成功",
      mode: "simple",
      messageType: "voice",
    },
  });
  expect(voice.ok()).toBeTruthy();
  const voiceBody = (await voice.json()) as { reply: { content: string } };
  expect(voiceBody.reply.content.length).toBeGreaterThan(0);

  expect(userId).toBeTruthy();
});
