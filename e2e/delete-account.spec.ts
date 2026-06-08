import { test, expect } from "@playwright/test";

test("delete account removes user and blocks subsequent access", async ({
  request,
}) => {
  const boot = await request.post("/v1/users/bootstrap");
  const { token } = (await boot.json()) as { token: string };
  const headers = { Authorization: `Bearer ${token}` };

  const char = await request.post("/v1/characters", {
    headers,
    data: {
      name: "DeleteE2E",
      personality: "gentle",
      backstory: "test",
      speakingStyle: "warm",
    },
  });
  const { characterId } = (await char.json()) as { characterId: string };

  await request.post("/v1/chat", {
    headers,
    data: { characterId, content: "今天天氣很好呀", mode: "simple" },
  });

  const del = await request.delete("/v1/users/me/data", { headers });
  expect(del.ok()).toBeTruthy();
  expect(((await del.json()) as { deleted: boolean }).deleted).toBe(true);

  const me = await request.get("/v1/users/me", { headers });
  expect(me.status()).toBe(404);
  expect(((await me.json()) as { error: string }).error).toBe("user_not_found");
});
