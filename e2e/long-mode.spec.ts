import { test, expect } from "@playwright/test";

test("long mode deducts five coins when sufficient balance", async ({
  request,
}) => {
  const boot = await request.post("/v1/users/bootstrap");
  const { token } = (await boot.json()) as { token: string };
  const headers = { Authorization: `Bearer ${token}` };

  const char = await request.post("/v1/characters", {
    headers,
    data: {
      name: "LongE2E",
      personality: "thoughtful",
      backstory: "test",
      speakingStyle: "warm",
    },
  });
  const { characterId } = (await char.json()) as { characterId: string };

  const meBefore = await request.get("/v1/users/me", { headers });
  const coinsBefore = ((await meBefore.json()) as { coins: number }).coins;
  expect(coinsBefore).toBeGreaterThanOrEqual(5);

  const chat = await request.post("/v1/chat", {
    headers,
    data: { characterId, content: "想聊聊最近的心情", mode: "long" },
  });
  expect(chat.ok()).toBeTruthy();

  const meAfter = await request.get("/v1/users/me", { headers });
  expect(((await meAfter.json()) as { coins: number }).coins).toBe(
    coinsBefore - 5,
  );
});

test("long mode rejects when coins insufficient", async ({ request }) => {
  const boot = await request.post("/v1/users/bootstrap");
  const { token } = (await boot.json()) as { token: string };
  const headers = { Authorization: `Bearer ${token}` };

  const char = await request.post("/v1/characters", {
    headers,
    data: {
      name: "LongNoCoins",
      personality: "thoughtful",
      backstory: "test",
      speakingStyle: "warm",
    },
  });
  const { characterId } = (await char.json()) as { characterId: string };

  for (let i = 0; i < 4; i++) {
    const res = await request.post("/v1/chat", {
      headers,
      data: { characterId, content: `deep talk ${i}`, mode: "long" },
    });
    expect(res.ok()).toBeTruthy();
  }

  const blocked = await request.post("/v1/chat", {
    headers,
    data: { characterId, content: "no coins left", mode: "long" },
  });
  expect(blocked.status()).toBe(402);
  expect(((await blocked.json()) as { error: string }).error).toBe(
    "insufficient_coins",
  );
});
