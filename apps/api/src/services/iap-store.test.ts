import { afterEach, describe, expect, it, vi } from "vitest";
import { verifyReceiptAsync } from "./iap.js";

describe("verifyReceiptAsync store scaffold", () => {
  const env = process.env;

  afterEach(() => {
    process.env = { ...env };
  });

  it("uses Apple stub when APPLE_IAP_SHARED_SECRET is set", async () => {
    process.env.APPLE_IAP_SHARED_SECRET = "test-secret";
    const r = await verifyReceiptAsync({
      platform: "ios",
      productId: "com.ctrlz.huhu.coins.small",
      receipt: "base64-receipt-stub-ok",
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.store).toBe("apple_sandbox_stub");
      expect(r.grant).toEqual({ kind: "coins", amount: 50 });
    }
  });

  it("calls Apple verifyReceipt when secret set and receipt is base64", async () => {
    process.env.APPLE_IAP_SHARED_SECRET = "test-secret";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 0,
        latest_receipt_info: [
          { product_id: "com.ctrlz.huhu.coins.small" },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const r = await verifyReceiptAsync({
      platform: "ios",
      productId: "com.ctrlz.huhu.coins.small",
      receipt: "dGVzdC1yZWNlaXB0LWRhdGE=",
    });
    vi.unstubAllGlobals();
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.store).toBe("apple_verify");
      expect(fetchMock).toHaveBeenCalled();
    }
  });

  it("uses Google stub when GOOGLE_PLAY_PACKAGE_NAME is set", async () => {
    delete process.env.APPLE_IAP_SHARED_SECRET;
    process.env.GOOGLE_PLAY_PACKAGE_NAME = "com.ctrlz.huhu";
    const r = await verifyReceiptAsync({
      platform: "android",
      productId: "com.ctrlz.huhu.sub.basic",
      receipt: "gp:purchase-token-abc",
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.store).toBe("google_play_stub");
  });
});
