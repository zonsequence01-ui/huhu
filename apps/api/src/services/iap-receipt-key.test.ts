import { describe, expect, it } from "vitest";
import {
  buildIapReceiptKey,
  extractTransactionIdFromReceipt,
} from "./iap-receipt-key.js";

describe("iap-receipt-key", () => {
  it("uses explicit transactionId when provided", () => {
    const key = buildIapReceiptKey({
      platform: "ios",
      receipt: "anything",
      productId: "com.ctrlz.huhu.sub.lite",
      transactionId: "TX-100",
    });
    expect(key).toBe("ios:tx:TX-100");
  });

  it("uses dev_stub receipt as transaction id", () => {
    const key = buildIapReceiptKey({
      platform: "ios",
      receipt: "dev_stub:lite-user-1",
      productId: "com.ctrlz.huhu.sub.lite",
    });
    expect(key).toBe("ios:tx:dev_stub:lite-user-1");
  });

  it("hashes unknown receipts deterministically", () => {
    const a = buildIapReceiptKey({
      platform: "web",
      receipt: "some-long-opaque-payload",
      productId: "com.ctrlz.huhu.coins.small",
    });
    const b = buildIapReceiptKey({
      platform: "web",
      receipt: "some-long-opaque-payload",
      productId: "com.ctrlz.huhu.coins.small",
    });
    expect(a).toBe(b);
    expect(a.startsWith("web:rcpt:")).toBe(true);
  });

  it("extracts transactionId from JWS payload", () => {
    const header = Buffer.from(JSON.stringify({ alg: "ES256" })).toString(
      "base64url",
    );
    const payload = Buffer.from(
      JSON.stringify({
        transactionId: "2000000123456789",
        productId: "com.ctrlz.huhu.sub.lite",
      }),
    ).toString("base64url");
    const jws = `${header}.${payload}.sig`;
    expect(
      extractTransactionIdFromReceipt("ios", jws, "com.ctrlz.huhu.sub.lite"),
    ).toBe("2000000123456789");
  });
});
