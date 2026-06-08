import { test, expect } from "@playwright/test";

test("free tier blocks creating more than three characters", async ({
  request,
}) => {
  const boot = await request.post("/v1/users/bootstrap");
  const { token } = (await boot.json()) as { token: string };
  const headers = { Authorization: `Bearer ${token}` };

  for (let i = 0; i < 3; i++) {
    const created = await request.post("/v1/characters", {
      headers,
      data: {
        name: `Char${i}`,
        personality: "friendly",
        backstory: "test",
        speakingStyle: "warm",
      },
    });
    expect(created.ok()).toBeTruthy();
  }

  const blocked = await request.post("/v1/characters", {
    headers,
    data: {
      name: "CharOver",
      personality: "friendly",
      backstory: "test",
      speakingStyle: "warm",
    },
  });
  expect(blocked.status()).toBe(403);
  const body = (await blocked.json()) as { error: string; limit: number };
  expect(body.error).toBe("character_limit_reached");
  expect(body.limit).toBe(3);
});
