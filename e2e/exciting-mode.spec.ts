import { test, expect } from "@playwright/test";

test("exciting mode deducts coins when sufficient balance", async ({
  request,
}) => {
  const boot = await request.post("/v1/users/bootstrap");
  const { token } = (await boot.json()) as { token: string };
  const headers = { Authorization: `Bearer ${token}` };

  const char = await request.post("/v1/characters", {
    headers,
    data: {
      name: "ExcitingE2E",
      personality: "romantic",
      backstory: "test",
      speakingStyle: "warm",
    },
  });
  const { characterId } = (await char.json()) as { characterId: string };

  const meBefore = await request.get("/v1/users/me", { headers });
  const coinsBefore = (await meBefore.json()) as { coins: number };
  expect(coinsBefore.coins).toBeGreaterThanOrEqual(10);

  const chat = await request.post("/v1/chat", {
    headers,
    data: {
      characterId,
      content: "今晚的約會好期待",
      mode: "exciting",
    },
  });
  expect(chat.ok()).toBeTruthy();

  const meAfter = await request.get("/v1/users/me", { headers });
  const coinsAfter = (await meAfter.json()) as { coins: number };
  expect(coinsAfter.coins).toBe(coinsBefore.coins - 10);
});

test("exciting mode rejects when coins insufficient", async ({ request }) => {
  const boot = await request.post("/v1/users/bootstrap");
  const { token } = (await boot.json()) as { token: string };
  const headers = { Authorization: `Bearer ${token}` };

  const char = await request.post("/v1/characters", {
    headers,
    data: {
      name: "ExcitingNoCoins",
      personality: "romantic",
      backstory: "test",
      speakingStyle: "warm",
    },
  });
  const { characterId } = (await char.json()) as { characterId: string };

  for (let i = 0; i < 2; i++) {
    const res = await request.post("/v1/chat", {
      headers,
      data: { characterId, content: `romantic scene ${i}`, mode: "exciting" },
    });
    expect(res.ok()).toBeTruthy();
  }

  const blocked = await request.post("/v1/chat", {
    headers,
    data: { characterId, content: "no coins left", mode: "exciting" },
  });
  expect(blocked.status()).toBe(402);
  expect(((await blocked.json()) as { error: string }).error).toBe(
    "insufficient_coins",
  );
});
