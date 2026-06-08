import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  buildOfferwallSignature,
  isOfferwallWebhookIpAllowed,
  issueOfferwallClaimTicket,
  verifyOfferwallSignature,
} from "./offerwall-verify.js";

describe("offerwall-verify", () => {
  const prev = process.env.OFFERWALL_SECRET;

  beforeEach(() => {
    process.env.OFFERWALL_SECRET = "test-secret";
  });

  afterEach(() => {
    process.env.OFFERWALL_SECRET = prev;
  });

  it("verifies valid HMAC signature", () => {
    const userId = "u1";
    const transactionId = "tx-abc";
    const timestamp = new Date().toISOString();
    const signature = buildOfferwallSignature(
      userId,
      transactionId,
      timestamp,
      "test-secret",
    );
    const result = verifyOfferwallSignature({
      userId,
      transactionId,
      timestamp,
      signature,
    });
    expect(result.ok).toBe(true);
  });

  it("issues claim ticket when secret configured", () => {
    const ticket = issueOfferwallClaimTicket("user-1");
    expect(ticket.verificationRequired).toBe(true);
    if (ticket.verificationRequired) {
      expect(ticket.transactionId.startsWith("ow_")).toBe(true);
      expect(ticket.signature.length).toBeGreaterThan(16);
    }
  });

  it("enforces webhook IP allowlist when configured", () => {
    const prev = process.env.OFFERWALL_ALLOWED_IPS;
    process.env.OFFERWALL_ALLOWED_IPS = "10.0.0.1,10.0.0.2";
    expect(isOfferwallWebhookIpAllowed("10.0.0.1")).toBe(true);
    expect(isOfferwallWebhookIpAllowed("192.168.1.1")).toBe(false);
    process.env.OFFERWALL_ALLOWED_IPS = prev;
  });

  it("rejects tampered signature", () => {
    const timestamp = new Date().toISOString();
    const result = verifyOfferwallSignature({
      userId: "u1",
      transactionId: "tx-1",
      timestamp,
      signature: "bad",
    });
    expect(result.ok).toBe(false);
  });
});
