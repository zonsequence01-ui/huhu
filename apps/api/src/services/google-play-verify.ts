import { createSign } from "node:crypto";
import { IAP_PRODUCTS, subscriptionBonusCoins } from "./iap-products.js";
import type { VerifyReceiptResult } from "./iap.js";

interface ServiceAccount {
  client_email: string;
  private_key: string;
}

function parseServiceAccount(): ServiceAccount | null {
  const raw = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ServiceAccount;
  } catch {
    return null;
  }
}

function base64Url(input: string | Buffer): string {
  const buf = typeof input === "string" ? Buffer.from(input) : input;
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

async function getAccessToken(sa: ServiceAccount): Promise<string | null> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64Url(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/androidpublisher",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  const unsigned = `${header}.${claim}`;
  const sign = createSign("RSA-SHA256");
  sign.update(unsigned);
  const signature = sign.sign(sa.private_key, "base64url");
  const jwt = `${unsigned}.${signature}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { access_token?: string };
  return data.access_token ?? null;
}

/** Receipt: `gp:<purchaseToken>` or `gp:<productId>:<purchaseToken>` */
export function parseGooglePlayReceipt(receipt: string): {
  purchaseToken: string;
} | null {
  if (!receipt.startsWith("gp:")) return null;
  const body = receipt.slice(3);
  if (!body || body.length < 8) return null;
  const parts = body.split(":");
  const purchaseToken =
    parts.length >= 2 ? parts.slice(1).join(":") : parts[0]!;
  return { purchaseToken };
}

export function isGooglePlayApiConfigured(): boolean {
  return (
    Boolean(process.env.GOOGLE_PLAY_PACKAGE_NAME?.trim()) &&
    parseServiceAccount() !== null
  );
}

export async function verifyGooglePlayPurchase(
  productId: string,
  receipt: string,
): Promise<VerifyReceiptResult> {
  const grant = IAP_PRODUCTS[productId];
  if (!grant) {
    return { ok: false, reason: "unknown_product" };
  }

  const pkg = process.env.GOOGLE_PLAY_PACKAGE_NAME?.trim();
  if (!pkg) {
    return { ok: false, reason: "store_verification_not_configured" };
  }

  const parsed = parseGooglePlayReceipt(receipt);
  if (!parsed) {
    return { ok: false, reason: "invalid_receipt" };
  }

  const sa = parseServiceAccount();
  if (!sa) {
    return { ok: false, reason: "google_service_account_missing" };
  }

  const token = await getAccessToken(sa);
  if (!token) {
    return { ok: false, reason: "google_oauth_failed" };
  }

  const { purchaseToken } = parsed;
  const base = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(pkg)}`;

  if (grant.kind === "subscription") {
    const url = `${base}/purchases/subscriptions/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      return { ok: false, reason: "google_subscription_lookup_failed" };
    }
    const data = (await res.json()) as {
      paymentState?: number;
      expiryTimeMillis?: string;
    };
    if (data.paymentState !== 1 && data.paymentState !== 2) {
      return { ok: false, reason: "google_subscription_not_paid" };
    }
    if (data.expiryTimeMillis) {
      const exp = Number(data.expiryTimeMillis);
      if (Number.isFinite(exp) && exp < Date.now()) {
        return { ok: false, reason: "google_subscription_expired" };
      }
    }
  } else {
    const url = `${base}/purchases/products/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      return { ok: false, reason: "google_product_lookup_failed" };
    }
    const data = (await res.json()) as { purchaseState?: number };
    if (data.purchaseState !== 0) {
      return { ok: false, reason: "google_product_not_purchased" };
    }
  }

  const bonusCoins =
    grant.kind === "subscription" ? subscriptionBonusCoins(grant.tier) : 0;
  return { ok: true, grant, bonusCoins, store: "google_play_api" };
}
