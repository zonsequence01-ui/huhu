import type { IapPlatform } from "./iap.js";
import { decodeJwsPayloadUnsafe, looksLikeAppStoreJws } from "./apple-app-store-server.js";
import { createHash } from "node:crypto";

export type IapReceiptKeyInput = {
  platform: IapPlatform;
  receipt: string;
  productId: string;
  transactionId?: string;
};

/** Stable store transaction id for idempotency (not raw receipt body). */
export function extractTransactionIdFromReceipt(
  platform: IapPlatform,
  receipt: string,
  productId: string,
): string | undefined {
  const explicit = receipt.trim();
  if (platform === "android" && explicit.startsWith("gp:")) {
    return explicit.slice(3).slice(0, 128);
  }
  if (looksLikeAppStoreJws(explicit)) {
    const payload = decodeJwsPayloadUnsafe(explicit);
    if (!payload) return undefined;
    const tx =
      payload.transactionId ??
      payload.originalTransactionId ??
      payload.webOrderLineItemId;
    if (typeof tx === "string" && tx.length > 0) return tx;
    const nested = payload.data;
    if (typeof nested === "string") {
      const inner = decodeJwsPayloadUnsafe(nested);
      const innerTx =
        inner?.transactionId ??
        inner?.originalTransactionId ??
        inner?.webOrderLineItemId;
      if (typeof innerTx === "string" && innerTx.length > 0) return innerTx;
    }
  }
  if (explicit === `valid_${productId}`) {
    return `dev_valid_${productId}`;
  }
  if (explicit.startsWith("dev_stub:")) {
    return explicit;
  }
  if (explicit.startsWith("valid_jws_")) {
    return explicit;
  }
  return undefined;
}

export function buildIapReceiptKey(input: IapReceiptKeyInput): string {
  const receipt = input.receipt.trim();
  const tx =
    input.transactionId?.trim() ||
    extractTransactionIdFromReceipt(
      input.platform,
      receipt,
      input.productId,
    );
  if (tx) {
    return `${input.platform}:tx:${tx.slice(0, 256)}`;
  }
  const digest = createHash("sha256")
    .update(receipt)
    .digest("hex")
    .slice(0, 32);
  return `${input.platform}:rcpt:${digest}`;
}
