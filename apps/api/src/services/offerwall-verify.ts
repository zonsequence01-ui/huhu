import { createHmac, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
  OFFERWALL_COINS_MAX,
  OFFERWALL_COINS_MIN,
  OFFERWALL_DAILY_CAP,
} from "@huhu/shared";
import type { Db } from "../db/index.js";
import { offerwallRedemptions, users } from "../db/schema-bindings.js";
import { syncUserStamina } from "./user-economy.js";

const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;

export function isOfferwallVerificationRequired(): boolean {
  return Boolean(process.env.OFFERWALL_SECRET?.trim());
}

export function parseOfferwallAllowedIps(): string[] {
  const raw = process.env.OFFERWALL_ALLOWED_IPS?.trim();
  if (!raw) return [];
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

export function isOfferwallWebhookIpAllowed(clientIp: string): boolean {
  const allowed = parseOfferwallAllowedIps();
  if (allowed.length === 0) return true;
  return allowed.includes(clientIp);
}

/** Prefer first X-Forwarded-For hop when behind a reverse proxy. */
export function clientIpFromRequest(req: {
  ip: string;
  headers: Record<string, string | string[] | undefined>;
}): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0]!.trim();
  }
  if (Array.isArray(forwarded) && forwarded[0]) {
    return String(forwarded[0]).split(",")[0]!.trim();
  }
  return req.ip;
}

function signPayload(
  userId: string,
  transactionId: string,
  timestamp: string,
  secret: string,
): string {
  const base = `${userId}|${transactionId}|${timestamp}`;
  return createHmac("sha256", secret).update(base).digest("hex");
}

export function verifyOfferwallSignature(input: {
  userId: string;
  transactionId: string;
  timestamp: string;
  signature: string;
}): { ok: true } | { ok: false; reason: string } {
  const secret = process.env.OFFERWALL_SECRET?.trim();
  if (!secret) {
    return { ok: false, reason: "offerwall_secret_not_configured" };
  }

  const ts = Date.parse(input.timestamp);
  if (Number.isNaN(ts)) {
    return { ok: false, reason: "invalid_timestamp" };
  }
  if (Math.abs(Date.now() - ts) > MAX_CLOCK_SKEW_MS) {
    return { ok: false, reason: "timestamp_expired" };
  }

  const expected = signPayload(
    input.userId,
    input.transactionId,
    input.timestamp,
    secret,
  );
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(input.signature, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: "invalid_signature" };
  }
  return { ok: true };
}

export function buildOfferwallSignature(
  userId: string,
  transactionId: string,
  timestamp: string,
  secret: string,
): string {
  return signPayload(userId, transactionId, timestamp, secret);
}

/** One-time claim ticket when OFFERWALL_SECRET is set (client must not hold secret). */
export function issueOfferwallClaimTicket(userId: string):
  | { verificationRequired: false }
  | {
      verificationRequired: true;
      transactionId: string;
      timestamp: string;
      signature: string;
    } {
  const secret = process.env.OFFERWALL_SECRET?.trim();
  if (!secret) {
    return { verificationRequired: false };
  }
  const transactionId = `ow_${nanoid()}`;
  const timestamp = new Date().toISOString();
  const signature = buildOfferwallSignature(
    userId,
    transactionId,
    timestamp,
    secret,
  );
  return { verificationRequired: true, transactionId, timestamp, signature };
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function claimOfferwallRewardVerified(
  db: Db,
  userId: string,
  input?: {
    transactionId?: string;
    timestamp?: string;
    signature?: string;
  },
): Promise<
  | { ok: true; coinsAwarded: number; coins: number; claimsRemaining: number }
  | { ok: false; reason: string }
> {
  const requireSig = isOfferwallVerificationRequired();

  if (requireSig) {
    const transactionId = input?.transactionId?.trim();
    const timestamp = input?.timestamp?.trim();
    const signature = input?.signature?.trim();
    if (!transactionId || !timestamp || !signature) {
      return { ok: false, reason: "offerwall_signature_required" };
    }
    const verified = verifyOfferwallSignature({
      userId,
      transactionId,
      timestamp,
      signature,
    });
    if (!verified.ok) return verified;

    const dup = await db
      .select()
      .from(offerwallRedemptions)
      .where(eq(offerwallRedemptions.transactionId, transactionId))
      .limit(1);
    if (dup.length > 0) {
      return { ok: false, reason: "transaction_already_redeemed" };
    }
  }

  const user = await syncUserStamina(db, userId);
  if (!user) return { ok: false, reason: "user_not_found" };

  const today = todayKey();
  let count =
    user.offerwallClaimsDate === today ? user.offerwallClaimsCount : 0;
  if (count >= OFFERWALL_DAILY_CAP) {
    return { ok: false, reason: "offerwall_daily_cap" };
  }

  const coinsAwarded =
    OFFERWALL_COINS_MIN +
    Math.floor(
      Math.random() * (OFFERWALL_COINS_MAX - OFFERWALL_COINS_MIN + 1),
    );
  count += 1;
  const newCoins = user.coins + coinsAwarded;

  await db
    .update(users)
    .set({
      coins: newCoins,
      offerwallClaimsDate: today,
      offerwallClaimsCount: count,
    })
    .where(eq(users.id, userId));

  if (requireSig && input?.transactionId) {
    await db.insert(offerwallRedemptions).values({
      transactionId: input.transactionId,
      userId,
      createdAt: new Date().toISOString(),
    });
  }

  return {
    ok: true,
    coinsAwarded,
    coins: newCoins,
    claimsRemaining: OFFERWALL_DAILY_CAP - count,
  };
}
