import { test, expect } from "@playwright/test";

test("bootstrap, create character, and chat", async ({ request }) => {
  const health = await request.get("/health");
  expect(health.ok()).toBeTruthy();

  const boot = await request.post("/v1/users/bootstrap");
  expect(boot.ok()).toBeTruthy();
  const { token, userId } = (await boot.json()) as {
    token: string;
    userId: string;
  };
  expect(token).toBeTruthy();

  const char = await request.post("/v1/characters", {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      name: "E2E小呼",
      personality: "溫柔",
      backstory: "測試",
      speakingStyle: "口語",
    },
  });
  expect(char.ok()).toBeTruthy();
  const { characterId } = (await char.json()) as { characterId: string };

  const chat = await request.post("/v1/chat", {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      characterId,
      content: "你好呀",
      mode: "simple",
    },
  });
  expect(chat.ok()).toBeTruthy();
  const body = (await chat.json()) as {
    userMessageId: string;
    reply: { id: string; content: string };
  };
  expect(body.userMessageId.length).toBeGreaterThan(0);
  expect(body.reply.id.length).toBeGreaterThan(0);
  expect(body.reply.content.length).toBeGreaterThan(0);
  expect(body.reply.content).toMatch(/收到|\[light\]|\[premium\]/);

  const list = await request.get(`/v1/users/${userId}/characters`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(list.ok()).toBeTruthy();

  const economy = await request.get("/v1/meta/economy");
  expect(economy.ok()).toBeTruthy();
  const economyBody = (await economy.json()) as {
    economy: { stamina: { max: number }; coins: { offerwallMin: number } };
  };
  expect(economyBody.economy.stamina.max).toBe(50);

  const support = await request.get("/v1/meta/support-resources?locale=zh-TW");
  expect(support.ok()).toBeTruthy();
  const supportBody = (await support.json()) as {
    resources: { crisis: { lines: string[] } };
  };
  expect(supportBody.resources.crisis.lines.length).toBeGreaterThan(0);
});
