import { isStoreVerificationConfigured, verifyWithStore } from "./iap-store.js";
import {
  IAP_PRODUCTS,
  subscriptionBonusCoins,
  type IapGrant,
} from "./iap-products.js";

export type { IapGrant } from "./iap-products.js";
export { IAP_PRODUCTS, subscriptionBonusCoins } from "./iap-products.js";

export type IapPlatform = "ios" | "android" | "web";

export interface VerifyReceiptInput {
  platform: IapPlatform;
  productId: string;
  receipt: string;
}

export type VerifyReceiptResult =
  | { ok: true; grant: IapGrant; bonusCoins: number; store?: string }
  | { ok: false; reason: string };

/**
 * Dev receipt format: `valid_<productId>` or set MOCK_IAP=1 with any non-empty receipt.
 */
export function verifyReceipt(input: VerifyReceiptInput): VerifyReceiptResult {
  const grant = IAP_PRODUCTS[input.productId];
  if (!grant) {
    return { ok: false, reason: "unknown_product" };
  }

  const receipt = input.receipt.trim();
  const mockAllowed =
    process.env.MOCK_IAP === "1" ||
    process.env.NODE_ENV !== "production";
  const validDevReceipt =
    receipt === `valid_${input.productId}` ||
    (mockAllowed && receipt.length >= 8);

  if (!validDevReceipt) {
    return { ok: false, reason: "invalid_receipt" };
  }

  const bonusCoins =
    grant.kind === "subscription"
      ? subscriptionBonusCoins(grant.tier)
      : 0;

  return { ok: true, grant, bonusCoins };
}

export async function verifyReceiptAsync(
  input: VerifyReceiptInput,
): Promise<VerifyReceiptResult> {
  if (!IAP_PRODUCTS[input.productId]) {
    return { ok: false, reason: "unknown_product" };
  }

  if (isStoreVerificationConfigured(input.platform)) {
    return verifyWithStore(input);
  }

  if (process.env.IAP_STRICT === "true") {
    return { ok: false, reason: "store_verification_not_configured" };
  }

  return verifyReceipt(input);
}
