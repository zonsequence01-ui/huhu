import { test, expect } from "@playwright/test";

test("exports chat as web novel markdown", async ({ request }) => {
  const boot = await request.post("/v1/users/bootstrap");
  expect(boot.ok()).toBeTruthy();
  const { token } = (await boot.json()) as { token: string };

  const char = await request.post("/v1/characters", {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      name: "ExportE2E",
      personality: "溫柔",
      backstory: "測試",
      speakingStyle: "口語",
    },
  });
  expect(char.ok()).toBeTruthy();
  const { characterId } = (await char.json()) as { characterId: string };

  const chat = await request.post("/v1/chat", {
    headers: { Authorization: `Bearer ${token}` },
    data: { characterId, content: "export test hello", mode: "simple" },
  });
  expect(chat.ok()).toBeTruthy();

  const exported = await request.get(
    `/v1/characters/${characterId}/export?format=webnovel`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  expect(exported.ok()).toBeTruthy();
  const body = (await exported.json()) as { markdown: string };
  expect(body.markdown).toContain("# ExportE2E");
  expect(body.markdown).toContain("export test hello");
});
