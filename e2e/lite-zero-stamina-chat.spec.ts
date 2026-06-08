import { test, expect } from "@playwright/test";

test("lite subscriber can chat when stamina is zero", async ({ request }) => {
  const boot = await request.post("/v1/users/bootstrap");
  const { token } = (await boot.json()) as { token: string };
  const headers = { Authorization: `Bearer ${token}` };

  await request.patch("/v1/users/me/subscription", {
    headers,
    data: { tier: "lite", stamina: 0 },
  });

  const char = await request.post("/v1/characters", {
    headers,
    data: {
      name: "LiteZero",
      personality: "溫柔",
      backstory: "測試",
      speakingStyle: "口語",
    },
  });
  const { characterId } = (await char.json()) as { characterId: string };

  const chat = await request.post("/v1/chat", {
    headers,
    data: { characterId, content: "hi lite zero stamina", mode: "simple" },
  });
  expect(chat.ok()).toBeTruthy();

  const me = await request.get("/v1/users/me", { headers });
  const meBody = (await me.json()) as {
    subscriptionTier: string;
    stamina: number;
  };
  expect(meBody.subscriptionTier).toBe("lite");
  expect(meBody.stamina).toBe(0);
});
