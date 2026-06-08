import type { IapPlatform, VerifyReceiptInput, VerifyReceiptResult } from "./iap.js";
import { IAP_PRODUCTS, subscriptionBonusCoins } from "./iap-products.js";
import {
  isGooglePlayApiConfigured,
  verifyGooglePlayPurchase,
} from "./google-play-verify.js";
import {
  isAppStoreJwsDecodeOnlyEnabled,
  isAppStoreJwsVerifyEnabled,
  looksLikeAppStoreJws,
  verifyAppStoreJwsTransaction,
} from "./apple-app-store-server.js";

export function isStoreVerificationConfigured(platform: IapPlatform): boolean {
  if (platform === "ios") {
    return Boolean(
      process.env.APPLE_IAP_SHARED_SECRET?.trim() ||
        isAppStoreJwsVerifyEnabled() ||
        isAppStoreJwsDecodeOnlyEnabled(),
    );
  }
  if (platform === "android") {
    return Boolean(process.env.GOOGLE_PLAY_PACKAGE_NAME?.trim());
  }
  return false;
}

interface AppleVerifyResponse {
  status: number;
  receipt?: {
    in_app?: Array<{ product_id?: string }>;
  };
  latest_receipt_info?: Array<{ product_id?: string }>;
}

async function verifyAppleReceipt(
  receipt: string,
  expectedProductId: string,
): Promise<VerifyReceiptResult> {
  const grant = IAP_PRODUCTS[expectedProductId];
  if (!grant) {
    return { ok: false, reason: "unknown_product" };
  }

  if (looksLikeAppStoreJws(receipt)) {
    return verifyAppStoreJwsTransaction(receipt, expectedProductId);
  }

  const secret = process.env.APPLE_IAP_SHARED_SECRET?.trim();
  if (!secret) {
    if (isAppStoreJwsVerifyEnabled() || isAppStoreJwsDecodeOnlyEnabled()) {
      return { ok: false, reason: "legacy_receipt_requires_shared_secret" };
    }
    return { ok: false, reason: "store_verification_not_configured" };
  }

  const useSandbox =
    process.env.APPLE_IAP_SANDBOX === "1" ||
    process.env.NODE_ENV !== "production";
  const urls = useSandbox
    ? ["https://sandbox.itunes.apple.com/verifyReceipt"]
    : [
        "https://buy.itunes.apple.com/verifyReceipt",
        "https://sandbox.itunes.apple.com/verifyReceipt",
      ];

  const body = JSON.stringify({
    "receipt-data": receipt,
    password: secret,
    "exclude-old-transactions": true,
  });

  let lastStatus = -1;
  for (const url of urls) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    if (!res.ok) {
      return { ok: false, reason: "apple_verify_http_error" };
    }
    const data = (await res.json()) as AppleVerifyResponse;
    lastStatus = data.status;
    if (data.status === 21007 && url.includes("buy.itunes")) {
      const sandboxRes = await fetch(
        "https://sandbox.itunes.apple.com/verifyReceipt",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        },
      );
      if (!sandboxRes.ok) {
        return { ok: false, reason: "apple_verify_http_error" };
      }
      const sandboxData = (await sandboxRes.json()) as AppleVerifyResponse;
      lastStatus = sandboxData.status;
      if (sandboxData.status !== 0) {
        return { ok: false, reason: `apple_status_${sandboxData.status}` };
      }
      return appleSuccess(grant, expectedProductId, sandboxData);
    }
    if (data.status !== 0) {
      continue;
    }
    return appleSuccess(grant, expectedProductId, data);
  }

  return { ok: false, reason: `apple_status_${lastStatus}` };
}

function appleSuccess(
  grant: NonNullable<(typeof IAP_PRODUCTS)[string]>,
  expectedProductId: string,
  data: AppleVerifyResponse,
): VerifyReceiptResult {
  const purchases = [
    ...(data.latest_receipt_info ?? []),
    ...(data.receipt?.in_app ?? []),
  ];
  const matched = purchases.some((p) => p.product_id === expectedProductId);
  if (!matched && purchases.length > 0) {
    return { ok: false, reason: "product_mismatch" };
  }
  const bonusCoins =
    grant.kind === "subscription" ? subscriptionBonusCoins(grant.tier) : 0;
  return { ok: true, grant, bonusCoins, store: "apple_verify" };
}

/**
 * Store verification. iOS uses Apple verifyReceipt when configured.
 */
export async function verifyWithStore(
  input: VerifyReceiptInput,
): Promise<VerifyReceiptResult> {
  const grant = IAP_PRODUCTS[input.productId];
  if (!grant) {
    return { ok: false, reason: "unknown_product" };
  }

  const receipt = input.receipt.trim();
  const bonusCoins =
    grant.kind === "subscription" ? subscriptionBonusCoins(grant.tier) : 0;

  if (input.platform === "ios") {
    if (receipt === `valid_${input.productId}`) {
      const bonus =
        grant.kind === "subscription" ? subscriptionBonusCoins(grant.tier) : 0;
      return { ok: true, grant, bonusCoins: bonus, store: "dev_receipt" };
    }
    if (
      receipt === "base64-receipt-stub-ok" ||
      receipt.startsWith("dev_stub:")
    ) {
      const bonus =
        grant.kind === "subscription" ? subscriptionBonusCoins(grant.tier) : 0;
      return { ok: true, grant, bonusCoins: bonus, store: "apple_sandbox_stub" };
    }
    return verifyAppleReceipt(receipt, input.productId);
  }

  if (input.platform === "android") {
    if (receipt === `valid_${input.productId}`) {
      const bonus =
        grant.kind === "subscription" ? subscriptionBonusCoins(grant.tier) : 0;
      return { ok: true, grant, bonusCoins: bonus, store: "dev_receipt" };
    }
    if (!process.env.GOOGLE_PLAY_PACKAGE_NAME?.trim()) {
      return { ok: false, reason: "store_verification_not_configured" };
    }
    if (isGooglePlayApiConfigured()) {
      return verifyGooglePlayPurchase(input.productId, receipt);
    }
    if (
      process.env.GOOGLE_PLAY_STUB === "1" ||
      process.env.NODE_ENV !== "production"
    ) {
      if (!receipt.startsWith("gp:") || receipt.length < 12) {
        return { ok: false, reason: "invalid_receipt" };
      }
      return { ok: true, grant, bonusCoins, store: "google_play_stub" };
    }
    return { ok: false, reason: "google_api_not_configured" };
  }

  return { ok: false, reason: "unsupported_platform" };
}
