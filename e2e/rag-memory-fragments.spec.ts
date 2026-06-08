import { test, expect } from "@playwright/test";

test("lists and deletes a single RAG memory fragment via API", async ({
  request,
}) => {
  const boot = await request.post("/v1/users/bootstrap");
  expect(boot.ok()).toBeTruthy();
  const { token } = (await boot.json()) as { token: string };
  const headers = { Authorization: `Bearer ${token}` };

  const age = await request.post("/v1/users/me/age-confirm", {
    headers,
    data: { birthYear: 1995 },
  });
  expect(age.ok()).toBeTruthy();

  const created = await request.post("/v1/characters", {
    headers,
    data: {
      name: "MemFrag",
      personality: "gentle",
      backstory: "test",
      speakingStyle: "warm",
    },
  });
  expect(created.ok()).toBeTruthy();
  const { characterId } = (await created.json()) as { characterId: string };

  const chat = await request.post("/v1/chat", {
    headers,
    data: {
      characterId,
      content: "我最喜歡週末去海邊散步看夕陽",
      mode: "simple",
    },
  });
  expect(chat.ok()).toBeTruthy();

  const list = await request.get(`/v1/characters/${characterId}/memories`, {
    headers,
  });
  expect(list.ok()).toBeTruthy();
  const { items } = (await list.json()) as {
    items: { id: string; preview: string }[];
  };
  expect(items.length).toBeGreaterThan(0);
  const memoryId = items[0]!.id;

  const del = await request.delete(
    `/v1/characters/${characterId}/memories/${memoryId}`,
    { headers },
  );
  expect(del.ok()).toBeTruthy();

  const after = await request.get(`/v1/characters/${characterId}/memories`, {
    headers,
  });
  const { items: remaining } = (await after.json()) as {
    items: { id: string }[];
  };
  expect(remaining.some((m) => m.id === memoryId)).toBe(false);
});
