import { test, expect } from "@playwright/test";

test("offerwall meta exposes integration mode and endpoints", async ({
  request,
}) => {
  const res = await request.get("/v1/meta/offerwall");
  expect(res.ok()).toBeTruthy();
  const body = (await res.json()) as {
    offerwall: {
      mode: string;
      verificationRequired: boolean;
      dailyCap: number;
      sdkIntegration: string;
      endpoints: { claim: string; prepare: string; webhook: string };
    };
  };
  expect(body.offerwall.mode).toMatch(/^(dev_direct|verified)$/);
  expect(body.offerwall.sdkIntegration).toBe("hmac_only");
  expect(body.offerwall.dailyCap).toBeGreaterThan(0);
  expect(body.offerwall.endpoints.claim).toBe("/v1/rewards/offerwall");
  expect(body.offerwall.endpoints.prepare).toBe(
    "/v1/rewards/offerwall/prepare",
  );
});
