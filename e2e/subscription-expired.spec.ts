import { test, expect } from "@playwright/test";

test("expired subscription downgrades to free on sync", async ({ request }) => {
  const boot = await request.post("/v1/users/bootstrap");
  const { token } = (await boot.json()) as { token: string };
  const headers = { Authorization: `Bearer ${token}` };

  await request.patch("/v1/users/me/subscription", {
    headers,
    data: {
      tier: "basic",
      expiresAt: "2020-01-01T00:00:00.000Z",
    },
  });

  const me = await request.get("/v1/users/me", { headers });
  expect(me.ok()).toBeTruthy();
  const body = (await me.json()) as { subscriptionTier: string };
  expect(body.subscriptionTier).toBe("free");
});
