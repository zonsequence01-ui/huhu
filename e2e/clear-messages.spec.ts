import { test, expect } from "@playwright/test";

test("deletes single message and clears all character messages", async ({
  request,
}) => {
  const boot = await request.post("/v1/users/bootstrap");
  const { token } = (await boot.json()) as { token: string };
  const headers = { Authorization: `Bearer ${token}` };

  const char = await request.post("/v1/characters", {
    headers,
    data: {
      name: "MsgClear",
      personality: "溫柔",
      backstory: "測試",
      speakingStyle: "口語",
    },
  });
  const { characterId } = (await char.json()) as { characterId: string };

  await request.post("/v1/chat", {
    headers,
    data: { characterId, content: "第一則", mode: "simple" },
  });
  await request.post("/v1/chat", {
    headers,
    data: { characterId, content: "第二則", mode: "simple" },
  });

  const listed = await request.get(
    `/v1/characters/${characterId}/messages?limit=10`,
    { headers },
  );
  expect(listed.ok()).toBeTruthy();
  const msgs = ((await listed.json()) as { messages: { id: string }[] })
    .messages;
  expect(msgs.length).toBeGreaterThanOrEqual(2);

  const delOne = await request.delete(
    `/v1/characters/${characterId}/messages/${msgs[0]!.id}`,
    { headers },
  );
  expect(delOne.ok()).toBeTruthy();

  const afterOne = await request.get(
    `/v1/characters/${characterId}/messages`,
    { headers },
  );
  const remaining = ((await afterOne.json()) as { messages: unknown[] })
    .messages;
  expect(remaining.length).toBe(msgs.length - 1);

  const clear = await request.delete(
    `/v1/characters/${characterId}/messages`,
    { headers },
  );
  expect(clear.ok()).toBeTruthy();

  const afterClear = await request.get(
    `/v1/characters/${characterId}/messages`,
    { headers },
  );
  expect(
    ((await afterClear.json()) as { messages: unknown[] }).messages,
  ).toHaveLength(0);
});
