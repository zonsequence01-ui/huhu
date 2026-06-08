import { test, expect } from "@playwright/test";

test("web novel export masks PII in user messages", async ({ request }) => {
  const boot = await request.post("/v1/users/bootstrap");
  const { token } = (await boot.json()) as { token: string };
  const headers = { Authorization: `Bearer ${token}` };

  const char = await request.post("/v1/characters", {
    headers,
    data: {
      name: "PiiExport",
      personality: "溫柔",
      backstory: "測試",
      speakingStyle: "口語",
    },
  });
  const { characterId } = (await char.json()) as { characterId: string };

  await request.post("/v1/chat", {
    headers,
    data: {
      characterId,
      content: "寄到 secret@test.com 謝謝",
      mode: "simple",
    },
  });

  const exported = await request.get(
    `/v1/characters/${characterId}/export?format=webnovel`,
    { headers },
  );
  expect(exported.ok()).toBeTruthy();
  const md = ((await exported.json()) as { markdown: string }).markdown;
  expect(md).toContain("[EMAIL]");
  expect(md).not.toContain("secret@test.com");
});
