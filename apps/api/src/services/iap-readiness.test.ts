import { describe, it, expect, afterEach } from "vitest";
import { getIapReadiness } from "./iap-readiness.js";

describe("iap-readiness", () => {
  const env = { ...process.env };

  afterEach(() => {
    process.env = { ...env };
  });

  it("reports mock dev in non-production", () => {
    process.env.NODE_ENV = "development";
    const r = getIapReadiness();
    expect(r.mockDevAllowed).toBe(true);
    expect(r.productionReady).toBe(false);
  });

  it("reflects Apple shared secret when set", () => {
    process.env.APPLE_IAP_SHARED_SECRET = "x";
    const r = getIapReadiness();
    expect(r.ios.legacyReceipt).toBe(true);
    expect(r.ios.configured).toBe(true);
  });

  it("requires Play API credentials for android configured", () => {
    process.env.GOOGLE_PLAY_PACKAGE_NAME = "com.ctrlz.huhu";
    expect(getIapReadiness().android.packageName).toBe(true);
    expect(getIapReadiness().android.configured).toBe(false);

    process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON = JSON.stringify({
      client_email: "svc@test.iam.gserviceaccount.com",
      private_key: "-----BEGIN PRIVATE KEY-----\nMII=\n-----END PRIVATE KEY-----\n",
    });
    expect(getIapReadiness().android.playApi).toBe(true);
    expect(getIapReadiness().android.configured).toBe(true);
  });

  it("splits platform production readiness", () => {
    process.env.NODE_ENV = "production";
    process.env.IAP_STRICT = "true";
    process.env.GOOGLE_PLAY_PACKAGE_NAME = "com.ctrlz.huhu";
    process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON = JSON.stringify({
      client_email: "svc@test.iam.gserviceaccount.com",
      private_key: "-----BEGIN PRIVATE KEY-----\nMII=\n-----END PRIVATE KEY-----\n",
    });
    const r = getIapReadiness();
    expect(r.androidProductionReady).toBe(true);
    expect(r.iosProductionReady).toBe(false);
    expect(r.productionReady).toBe(false);

    process.env.APPLE_IAP_SHARED_SECRET = "secret";
    const both = getIapReadiness();
    expect(both.iosProductionReady).toBe(true);
    expect(both.productionReady).toBe(true);
  });
});
