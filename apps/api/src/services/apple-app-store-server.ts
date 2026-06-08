import { compactVerify, importX509 } from "jose";
import type { VerifyReceiptResult } from "./iap.js";
import { IAP_PRODUCTS, subscriptionBonusCoins } from "./iap-products.js";
import {
  isAppleRootPinningEnabled,
  verifyX5cAnchorsToTrustedRoots,
} from "./apple-trusted-roots.js";
import { verifyAppleX5cChain } from "./apple-x5c-chain.js";
export { pemFromDerBase64, verifyAppleX5cChain } from "./apple-x5c-chain.js";

export function looksLikeAppStoreJws(token: string): boolean {
  const t = token.trim();
  const parts = t.split(".");
  return parts.length === 3 && parts[0]!.startsWith("eyJ");
}

export function isAppStoreServerApiConfigured(): boolean {
  return Boolean(
    process.env.APPLE_APP_STORE_KEY_ID?.trim() &&
      process.env.APPLE_APP_STORE_ISSUER_ID?.trim() &&
      process.env.APPLE_APP_STORE_PRIVATE_KEY?.trim() &&
      process.env.APPLE_APP_STORE_BUNDLE_ID?.trim(),
  );
}

export function isAppStoreJwsVerifyEnabled(): boolean {
  return (
    Boolean(process.env.APPLE_APP_STORE_BUNDLE_ID?.trim()) &&
    !isAppStoreJwsDecodeOnlyEnabled()
  );
}

/** Staging: decode JWS payload without signature verification (never in production). */
export function isAppStoreJwsDecodeOnlyEnabled(): boolean {
  return process.env.APPLE_APP_STORE_JWS_DECODE_ONLY === "1";
}

export function decodeJwsPayloadUnsafe(
  jws: string,
): Record<string, unknown> | null {
  const parts = jws.trim().split(".");
  if (parts.length !== 3) return null;
  try {
    const json = Buffer.from(parts[1]!, "base64url").toString("utf8");
    const parsed = JSON.parse(json) as unknown;
    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

export async function verifyAndDecodeAppleJws(
  jws: string,
): Promise<
  { ok: true; payload: Record<string, unknown> } | { ok: false; reason: string }
> {
  const parts = jws.trim().split(".");
  if (parts.length !== 3) {
    return { ok: false, reason: "invalid_jws_format" };
  }

  let header: { alg?: string; x5c?: string[] };
  try {
    header = JSON.parse(
      Buffer.from(parts[0]!, "base64url").toString("utf8"),
    ) as { alg?: string; x5c?: string[] };
  } catch {
    return { ok: false, reason: "invalid_jws_header" };
  }

  const alg = header.alg ?? "ES256";
  if (alg !== "ES256") {
    return { ok: false, reason: "unsupported_jws_alg" };
  }

  const chain = header.x5c ?? [];
  const leaf = chain[0];
  if (!leaf) {
    return { ok: false, reason: "missing_x5c_certificate" };
  }

  if (chain.length >= 2) {
    const chainOk = verifyAppleX5cChain(chain);
    if (!chainOk) {
      return { ok: false, reason: "invalid_x5c_certificate_chain" };
    }
    if (isAppleRootPinningEnabled()) {
      const anchored = verifyX5cAnchorsToTrustedRoots(chain);
      if (!anchored) {
        return { ok: false, reason: "untrusted_x5c_root" };
      }
    }
  } else if (chain.length === 1 && isAppleRootPinningEnabled()) {
    const anchored = verifyX5cAnchorsToTrustedRoots(chain);
    if (!anchored) {
      return { ok: false, reason: "untrusted_x5c_root" };
    }
  }

  const pem = `-----BEGIN CERTIFICATE-----\n${leaf}\n-----END CERTIFICATE-----`;
  try {
    const key = await importX509(pem, alg);
    const verified = await compactVerify(jws, key);
    const payload = JSON.parse(
      new TextDecoder().decode(verified.payload),
    ) as Record<string, unknown>;
    return { ok: true, payload };
  } catch {
    return { ok: false, reason: "jws_signature_invalid" };
  }
}

function productIdFromJwsPayload(
  payload: Record<string, unknown>,
): string | undefined {
  const direct = payload.productId;
  if (typeof direct === "string" && direct.length > 0) return direct;
  const nested = payload.data;
  if (typeof nested === "string") {
    const inner = decodeJwsPayloadUnsafe(nested);
    if (inner && typeof inner.productId === "string") return inner.productId;
  }
  return undefined;
}

function bundleIdFromJwsPayload(
  payload: Record<string, unknown>,
): string | undefined {
  const direct = payload.bundleId;
  if (typeof direct === "string" && direct.length > 0) return direct;
  return undefined;
}

function validateJwsPayload(
  payload: Record<string, unknown>,
  expectedProductId: string,
): { ok: true } | { ok: false; reason: string } {
  const productId = productIdFromJwsPayload(payload);
  if (!productId || productId !== expectedProductId) {
    return { ok: false, reason: "product_mismatch" };
  }

  const expectedBundle = process.env.APPLE_APP_STORE_BUNDLE_ID?.trim();
  const bundleId = bundleIdFromJwsPayload(payload);
  if (expectedBundle && bundleId && bundleId !== expectedBundle) {
    return { ok: false, reason: "bundle_mismatch" };
  }

  return { ok: true };
}

/**
 * App Store Server API v2: signedTransaction JWS.
 */
export async function verifyAppStoreJwsTransaction(
  signedTransaction: string,
  expectedProductId: string,
): Promise<VerifyReceiptResult> {
  const grant = IAP_PRODUCTS[expectedProductId];
  if (!grant) {
    return { ok: false, reason: "unknown_product" };
  }

  const receipt = signedTransaction.trim();
  if (receipt === `valid_jws_${expectedProductId}`) {
    const bonus =
      grant.kind === "subscription" ? subscriptionBonusCoins(grant.tier) : 0;
    return { ok: true, grant, bonusCoins: bonus, store: "dev_jws_receipt" };
  }

  if (!looksLikeAppStoreJws(receipt)) {
    return { ok: false, reason: "invalid_jws_format" };
  }

  if (
    process.env.NODE_ENV === "production" &&
    isAppStoreJwsDecodeOnlyEnabled()
  ) {
    return { ok: false, reason: "jws_decode_only_forbidden_in_production" };
  }

  let payload: Record<string, unknown> | null = null;
  let store = "apple_jws_decode_only";

  if (isAppStoreJwsVerifyEnabled()) {
    const verified = await verifyAndDecodeAppleJws(receipt);
    if (!verified.ok) return verified;
    payload = verified.payload;
    store = "apple_jws_verified";
  } else if (isAppStoreJwsDecodeOnlyEnabled()) {
    payload = decodeJwsPayloadUnsafe(receipt);
    if (!payload) {
      return { ok: false, reason: "invalid_jws_payload" };
    }
  } else {
    return { ok: false, reason: "app_store_jws_not_configured" };
  }

  const check = validateJwsPayload(payload, expectedProductId);
  if (!check.ok) return check;

  const bonusCoins =
    grant.kind === "subscription" ? subscriptionBonusCoins(grant.tier) : 0;
  return {
    ok: true,
    grant,
    bonusCoins,
    store,
  };
}
