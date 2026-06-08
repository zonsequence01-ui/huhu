import { test, expect } from "@playwright/test";

test("offerwall awards coins with HMAC prepare flow", async ({ request }) => {
  const boot = await request.post("/v1/users/bootstrap");
  expect(boot.ok()).toBeTruthy();
  const { token } = (await boot.json()) as { token: string };

  const meBefore = await request.get("/v1/users/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(meBefore.ok()).toBeTruthy();
  const coinsBefore = (await meBefore.json()) as { coins: number };

  const prep = await request.post("/v1/rewards/offerwall/prepare", {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(prep.ok()).toBeTruthy();
  const prepBody = (await prep.json()) as {
    verificationRequired?: boolean;
    transactionId?: string;
    timestamp?: number;
    signature?: string;
  };

  const claimBody =
    prepBody.verificationRequired === true
      ? {
          transactionId: prepBody.transactionId,
          timestamp: prepBody.timestamp,
          signature: prepBody.signature,
        }
      : {};

  const claim = await request.post("/v1/rewards/offerwall", {
    headers: { Authorization: `Bearer ${token}` },
    data: claimBody,
  });
  expect(claim.ok()).toBeTruthy();
  const claimResult = (await claim.json()) as { coinsAwarded: number };
  expect(claimResult.coinsAwarded).toBeGreaterThanOrEqual(1);

  const meAfter = await request.get("/v1/users/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(meAfter.ok()).toBeTruthy();
  const coinsAfter = (await meAfter.json()) as { coins: number };
  expect(coinsAfter.coins).toBeGreaterThan(coinsBefore.coins);
});
