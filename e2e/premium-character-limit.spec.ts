import { test, expect } from "@playwright/test";

test("premium tier allows more than three characters", async ({ request }) => {
  const boot = await request.post("/v1/users/bootstrap");
  const { token, userId } = (await boot.json()) as {
    token: string;
    userId: string;
  };
  const headers = { Authorization: `Bearer ${token}` };

  const iap = await request.post("/v1/iap/verify", {
    headers,
    data: {
      platform: "ios",
      productId: "com.ctrlz.huhu.sub.premium",
      receipt: `dev_stub:premium-chars-${userId}`,
    },
  });
  expect(iap.ok()).toBeTruthy();

  for (let i = 0; i < 4; i++) {
    const created = await request.post("/v1/characters", {
      headers,
      data: {
        name: `PremiumChar${i}`,
        personality: "bold",
        backstory: "test",
        speakingStyle: "warm",
      },
    });
    expect(created.ok()).toBeTruthy();
  }
});
