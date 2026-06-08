import { test, expect } from "@playwright/test";
import { PUBLIC_META_PATHS } from "@huhu/shared";

test("health reports blueprint economy and bundle id", async ({ request }) => {
  const res = await request.get("/health");
  expect(res.ok()).toBeTruthy();
  const body = (await res.json()) as {
    bundleId: string;
    economy: {
      stamina: {
        max: number;
        recoverIntervalMs: number;
        costText: number;
        costVoice: number;
      };
    };
    iap: { mockDevAllowed: boolean };
    publicMeta: Record<string, string>;
    security?: { jwtSecretConfigured: boolean };
    deployment?: { storePublicSiteUrl: string };
  };
  expect(body.bundleId).toBe("com.ctrlz.huhu");
  expect(body.publicMeta).toEqual(PUBLIC_META_PATHS);
  expect(body.economy.stamina.max).toBe(50);
  expect(body.economy.stamina.recoverIntervalMs).toBe(600_000);
  expect(body.economy.stamina.costText).toBe(1);
  expect(body.economy.stamina.costVoice).toBe(3);
  expect(typeof body.iap.mockDevAllowed).toBe("boolean");
  expect(typeof body.security?.jwtSecretConfigured).toBe("boolean");
  expect(body.deployment?.storePublicSiteUrl).toMatch(/^https:\/\//);
});
