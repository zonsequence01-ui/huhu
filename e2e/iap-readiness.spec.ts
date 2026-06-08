import { test, expect } from "@playwright/test";

test("iap-readiness reports platform verification status", async ({
  request,
}) => {
  const res = await request.get("/v1/meta/iap-readiness");
  expect(res.ok()).toBeTruthy();
  const body = (await res.json()) as {
    readiness: {
      strict: boolean;
      mockDevAllowed: boolean;
      ios: { configured: boolean; legacyReceipt: boolean };
      android: { configured: boolean; packageName: boolean };
    };
  };
  expect(typeof body.readiness.ios.configured).toBe("boolean");
  expect(typeof body.readiness.android.configured).toBe("boolean");
  expect(body.readiness.mockDevAllowed).toBe(true);
  expect(body.readiness.strict).toBe(false);
});
