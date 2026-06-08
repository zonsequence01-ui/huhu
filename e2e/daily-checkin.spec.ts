import { test, expect } from "@playwright/test";

test("daily check-in awards coins once per day", async ({ request }) => {
  const boot = await request.post("/v1/users/bootstrap");
  expect(boot.ok()).toBeTruthy();
  const { token } = (await boot.json()) as { token: string };

  const first = await request.post("/v1/rewards/daily-checkin", {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(first.ok()).toBeTruthy();
  const firstBody = (await first.json()) as { coinsAwarded: number };
  expect(firstBody.coinsAwarded).toBeGreaterThan(0);

  const second = await request.post("/v1/rewards/daily-checkin", {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(second.status()).toBe(409);
  const secondBody = (await second.json()) as { error: string };
  expect(secondBody.error).toBe("daily_checkin_already_claimed");
});
