import { test, expect } from "@playwright/test";

test("clears RAG memory for a character", async ({ request }) => {
  const boot = await request.post("/v1/users/bootstrap");
  const { token } = (await boot.json()) as { token: string };
  const headers = { Authorization: `Bearer ${token}` };

  const char = await request.post("/v1/characters", {
    headers,
    data: {
      name: "MemClear",
      personality: "gentle",
      backstory: "test",
      speakingStyle: "warm",
    },
  });
  const { characterId } = (await char.json()) as { characterId: string };

  const chat = await request.post("/v1/chat", {
    headers,
    data: {
      characterId,
      content: "我最喜歡週末去海邊散步看夕陽",
      mode: "simple",
    },
  });
  expect(chat.ok()).toBeTruthy();

  const cleared = await request.delete(
    `/v1/characters/${characterId}/memories`,
    { headers },
  );
  expect(cleared.ok()).toBeTruthy();
  const body = (await cleared.json()) as { cleared: boolean };
  expect(body.cleared).toBe(true);
});
