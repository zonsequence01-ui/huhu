import { test, expect } from "@playwright/test";

test("returns locale-aware crisis response for ja user", async ({ request }) => {
  const boot = await request.post("/v1/users/bootstrap");
  expect(boot.ok()).toBeTruthy();
  const { token } = (await boot.json()) as { token: string };

  const locale = await request.patch("/v1/users/me/locale", {
    headers: { Authorization: `Bearer ${token}` },
    data: { locale: "ja-JP" },
  });
  expect(locale.ok()).toBeTruthy();

  const char = await request.post("/v1/characters", {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      name: "E2E桜",
      personality: "優しい",
      backstory: "テスト",
      speakingStyle: "丁寧",
    },
  });
  expect(char.ok()).toBeTruthy();
  const { characterId } = (await char.json()) as { characterId: string };

  const chat = await request.post("/v1/chat", {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      characterId,
      content: "死にたい",
      mode: "simple",
    },
  });
  expect(chat.ok()).toBeTruthy();
  const body = (await chat.json()) as {
    safety: { flagged: boolean };
    reply: { content: string };
  };
  expect(body.safety.flagged).toBe(true);
  expect(body.reply.content).toContain("いのちの電話");

  const history = await request.get(
    `/v1/characters/${characterId}/messages?limit=10`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  expect(history.ok()).toBeTruthy();
  const histBody = (await history.json()) as {
    messages: { role: string; safety?: { flagged: boolean; category: string } }[];
  };
  expect(histBody.messages.length).toBeGreaterThanOrEqual(2);
  const assistant = histBody.messages.find((m) => m.role === "assistant");
  expect(assistant?.safety?.flagged).toBe(true);
  expect(assistant?.safety?.category).toBe("crisis");
});

test("returns wellness safety response and persists history", async ({
  request,
}) => {
  const boot = await request.post("/v1/users/bootstrap");
  expect(boot.ok()).toBeTruthy();
  const { token } = (await boot.json()) as { token: string };

  const char = await request.post("/v1/characters", {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      name: "WellnessE2E",
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
      content: "好抑鬱活著沒意思",
      mode: "simple",
    },
  });
  expect(chat.ok()).toBeTruthy();
  const body = (await chat.json()) as {
    safety: { flagged: boolean; category?: string };
    reply: { content: string };
  };
  expect(body.safety.flagged).toBe(true);
  expect(body.safety.category).toBe("wellness");
  expect(body.reply.content.length).toBeGreaterThan(0);

  const history = await request.get(
    `/v1/characters/${characterId}/messages?limit=10`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  expect(history.ok()).toBeTruthy();
  const histBody = (await history.json()) as {
    messages: { role: string; safety?: { category: string } }[];
  };
  const assistant = histBody.messages.find((m) => m.role === "assistant");
  expect(assistant?.safety?.category).toBe("wellness");
});

test("returns vi support resources bundle", async ({ request }) => {
  const res = await request.get("/v1/meta/support-resources?locale=vi-VN");
  expect(res.ok()).toBeTruthy();
  const body = (await res.json()) as {
    resources: { region: string; crisis: { lines: string[] } };
  };
  expect(body.resources.region).toBe("VN");
  expect(body.resources.crisis.lines.some((l) => l.includes("096 306 1414"))).toBe(
    true,
  );
});
