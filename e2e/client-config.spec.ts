import { test, expect } from "@playwright/test";
import { API_ERROR_CODES } from "@huhu/shared";

test("client-config bundles economy, offerwall, and support resources", async ({
  request,
}) => {
  const res = await request.get("/v1/meta/client-config?locale=ko-KR");
  expect(res.ok()).toBeTruthy();
  const body = (await res.json()) as {
    config: {
      economy: { stamina: { max: number } };
      offerwall: { sdkIntegration: string };
      supportResources: { region: string };
      storeUrls: { support: string; privacy: string };
      subscriptionTiersPrompt: string;
      subscriptionTiers: {
        tier: string;
        entitlements: { voice: boolean };
        entitlementsLabel: string;
        tierDisplayName: string;
      }[];
      apiErrors: Record<string, string>;
    };
  };
  expect(body.config.economy.stamina.max).toBe(50);
  expect(body.config.offerwall.sdkIntegration).toBe("hmac_only");
  expect(body.config.supportResources.region).toBe("KR");
  expect(body.config.storeUrls.support).toMatch(/\/support(\.html)?$/);
  expect(body.config.storeUrls.privacy).toMatch(/\/privacy(\.html)?$/);
  expect(body.config.subscriptionTiers.map((t) => t.tier)).toEqual([
    "lite",
    "basic",
    "premium",
  ]);
  const basic = body.config.subscriptionTiers.find((t) => t.tier === "basic");
  expect(basic?.entitlements.voice).toBe(true);
  expect(basic?.entitlementsLabel.length).toBeGreaterThan(5);
  expect(basic?.tierDisplayName).toMatch(/베이직|Basic/i);
  expect(body.config.subscriptionTiersPrompt).toMatch(/베이직|Basic/i);
  expect(body.config.apiErrors.voice_requires_basic_subscription).toMatch(
    /베이직/,
  );
  expect(body.config.apiErrors.insufficient_coins).toMatch(/코인/);
  expect(body.config.apiErrors.insufficient_coins).not.toMatch(/Not enough/i);
  expect(body.config.apiErrors.validation_failed.length).toBeGreaterThan(2);
  expect(body.config.apiErrors.rate_limited).toMatch(/요청|잠시|너무/);
  expect(body.config.apiErrors.validation_failed).toMatch(/형식|확인/);
  expect(Object.keys(body.config.apiErrors).sort()).toEqual(
    [...API_ERROR_CODES].sort(),
  );
});

test("client-config ja-JP apiErrors are Japanese", async ({ request }) => {
  const res = await request.get("/v1/meta/client-config?locale=ja-JP");
  expect(res.ok()).toBeTruthy();
  const body = (await res.json()) as {
    config: { apiErrors: Record<string, string> };
  };
  expect(Object.keys(body.config.apiErrors).sort()).toEqual(
    [...API_ERROR_CODES].sort(),
  );
  expect(body.config.apiErrors.insufficient_coins).toMatch(/コイン/);
  expect(body.config.apiErrors.insufficient_coins).not.toMatch(/Not enough/i);
  expect(body.config.apiErrors.content_required).toMatch(/メッセージ|入力/);
  expect(body.config.apiErrors.validation_failed).toMatch(/形式|確認/);
});

test("client-config vi-VN apiErrors are Vietnamese", async ({ request }) => {
  const res = await request.get("/v1/meta/client-config?locale=vi-VN");
  expect(res.ok()).toBeTruthy();
  const body = (await res.json()) as {
    config: { apiErrors: Record<string, string> };
  };
  expect(Object.keys(body.config.apiErrors).sort()).toEqual(
    [...API_ERROR_CODES].sort(),
  );
  expect(body.config.apiErrors.validation_failed).toMatch(/hợp lệ|kiểm tra/i);
  expect(body.config.apiErrors.rate_limited).toMatch(/Quá nhiều|thử lại/i);
});

test("client-config en-US apiErrors are English", async ({ request }) => {
  const res = await request.get("/v1/meta/client-config?locale=en-US");
  expect(res.ok()).toBeTruthy();
  const body = (await res.json()) as {
    config: { apiErrors: Record<string, string> };
  };
  expect(Object.keys(body.config.apiErrors).sort()).toEqual(
    [...API_ERROR_CODES].sort(),
  );
  expect(body.config.apiErrors.insufficient_stamina).toMatch(
    /stamina|energy/i,
  );
  expect(body.config.apiErrors.content_required).toMatch(/message|content/i);
});
