import { test, expect } from "@playwright/test";

test("corrects character break and persists in history", async ({ request }) => {
  const boot = await request.post("/v1/users/bootstrap");
  expect(boot.ok()).toBeTruthy();
  const { token } = (await boot.json()) as { token: string };

  const char = await request.post("/v1/characters", {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      name: "GuardE2E",
      personality: "溫柔",
      backstory: "測試",
      speakingStyle: "口語",
    },
  });
  expect(char.ok()).toBeTruthy();
  const { characterId } = (await char.json()) as { characterId: string };

  const chat = await request.post("/v1/chat", {
    headers: { Authorization: `Bearer ${token}` },
    data: { characterId, content: "__mock_break_character__", mode: "simple" },
  });
  expect(chat.ok()).toBeTruthy();
  const chatBody = (await chat.json()) as {
    reply: { content: string; characterCorrected?: boolean };
  };
  expect(chatBody.reply.characterCorrected).toBe(true);
  expect(chatBody.reply.content).not.toMatch(/人工智慧|language model/i);

  const history = await request.get(
    `/v1/characters/${characterId}/messages?limit=10`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  expect(history.ok()).toBeTruthy();
  const rows = (await history.json()) as {
    messages: { characterCorrected?: boolean }[];
  };
  expect(rows.messages.some((m) => m.characterCorrected)).toBe(true);
});
