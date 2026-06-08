import { test, expect } from "@playwright/test";

test("relationship reset restores stranger stage", async ({ request }) => {
  const boot = await request.post("/v1/users/bootstrap");
  const { token } = (await boot.json()) as { token: string };
  const headers = { Authorization: `Bearer ${token}` };

  const char = await request.post("/v1/characters", {
    headers,
    data: {
      name: "ResetE2E",
      personality: "gentle",
      backstory: "test",
      speakingStyle: "warm",
    },
  });
  expect(char.ok()).toBeTruthy();
  const { characterId } = (await char.json()) as { characterId: string };

  const chat = await request.post("/v1/chat", {
    headers,
    data: { characterId, content: "今天很開心", mode: "simple" },
  });
  expect(chat.ok()).toBeTruthy();
  const chatBody = (await chat.json()) as {
    relationship: { affection: number };
  };
  expect(chatBody.relationship.affection).toBeGreaterThan(0);

  const reset = await request.post(
    `/v1/characters/${characterId}/relationship/reset`,
    { headers },
  );
  expect(reset.ok()).toBeTruthy();
  const resetBody = (await reset.json()) as {
    affection: number;
    stage: string;
  };
  expect(resetBody.affection).toBe(0);
  expect(resetBody.stage).toBe("stranger");
});
