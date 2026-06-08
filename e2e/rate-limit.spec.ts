import { test, expect } from "@playwright/test";

test("friend request returns localized rate_limited after hourly cap", async ({
  request,
}) => {
  const configRes = await request.get("/v1/meta/client-config?locale=zh-TW");
  const rateMsg = (
    (await configRes.json()) as {
      config: { apiErrors: Record<string, string> };
    }
  ).config.apiErrors.rate_limited;
  expect(rateMsg).toMatch(/頻繁|稍後/);

  const boot = await request.post("/v1/users/bootstrap");
  const { token } = (await boot.json()) as { token: string };

  const targets: string[] = [];
  for (let i = 0; i < 3; i++) {
    const other = await request.post("/v1/users/bootstrap");
    targets.push(((await other.json()) as { userId: string }).userId);
  }

  for (const targetUserId of targets.slice(0, 2)) {
    const ok = await request.post("/v1/friends/request", {
      headers: { Authorization: `Bearer ${token}` },
      data: { targetUserId },
    });
    expect([200, 201]).toContain(ok.status());
  }

  const limited = await request.post("/v1/friends/request", {
    headers: { Authorization: `Bearer ${token}` },
    data: { targetUserId: targets[2] },
  });
  expect(limited.status()).toBe(429);
  expect(((await limited.json()) as { error: string }).error).toBe(
    "rate_limited",
  );
});

test("user search returns localized rate_limited after hourly cap", async ({
  request,
}) => {
  const configRes = await request.get("/v1/meta/client-config?locale=zh-TW");
  const rateMsg = (
    (await configRes.json()) as {
      config: { apiErrors: Record<string, string> };
    }
  ).config.apiErrors.rate_limited;
  expect(rateMsg).toMatch(/頻繁|稍後/);

  const boot = await request.post("/v1/users/bootstrap");
  const { token } = (await boot.json()) as { token: string };
  const headers = { Authorization: `Bearer ${token}` };

  const other = await request.post("/v1/users/bootstrap");
  const otherMe = await request.get("/v1/users/me", {
    headers: {
      Authorization: `Bearer ${((await other.json()) as { token: string }).token}`,
    },
  });
  const displayName = ((await otherMe.json()) as { displayName: string })
    .displayName;
  expect(displayName.length).toBeGreaterThan(1);

  for (let i = 0; i < 2; i++) {
    const ok = await request.get(
      `/v1/users/search?q=${encodeURIComponent(displayName.slice(0, 4))}`,
      { headers },
    );
    expect(ok.ok()).toBeTruthy();
  }

  const limited = await request.get(
    `/v1/users/search?q=${encodeURIComponent(displayName)}`,
    { headers },
  );
  expect(limited.status()).toBe(429);
  const body = (await limited.json()) as { error: string };
  expect(body.error).toBe("rate_limited");
});
