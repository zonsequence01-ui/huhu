import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { nanoid } from "nanoid";
import { and, desc, eq, inArray, or } from "drizzle-orm";
import {
  STAMINA_COST_TEXT,
  STAMINA_COST_VOICE,
  STAMINA_COST_IMAGE,
  STAMINA_MAX,
  CHAT_MODES,
  type ChatMode,
  type SubscriptionTier,
} from "@huhu/shared";
import {
  canSpendStamina,
  canSpendCoins,
  memoryRetrievalLimit,
  maxReplyTokens,
  canUseVoice,
  hasPremiumContentTier,
  buildSubscriptionTierCatalog,
} from "@huhu/economy";
import {
  createLlmProvider,
  buildSystemPrompt,
  checkMessageSafety,
  retrieveMemories,
  scrubPii,
  selectModelTier,
  guardCharacterReply,
  createEmbedFn,
  MOCK_BREAK_CHARACTER_TRIGGER,
  synthesizeVoice,
  transcribeVoiceAudio,
  describeChatImage,
} from "@huhu/ai";
import {
  getEconomyMeta,
  getPricing,
  getUsdBaseline,
  affectionPercent,
  stageLabelForLocale,
  SUBSCRIPTION_TIERS,
  CHARACTER_PRESETS,
  getPreset,
  defaultPresetForLocale,
  type PricingRegion,
  SUPPORTED_LOCALES,
  SUPPORTED_LOCALE_IDS,
  normalizeClientLocale,
  localeHint,
  getUiStrings,
  tUi,
  getSupportResources,
  subscriptionProductId,
  subscriptionProductIdForPlatform,
  type IapGrant,
  buildOfferwallClientMeta,
  buildClientConfigMeta,
  formatTierEntitlementsLabel,
  formatSubscriptionTierDisplayName,
  formatSubscriptionTiersPrompt,
  buildApiErrorsMeta,
  PUBLIC_META_PATHS,
  getStoreUrls,
} from "@huhu/shared";
import { signAccessToken, requireAuth } from "./auth.js";
import { buildUserPlan } from "./services/user-plan.js";
import { createDatabase, type Db } from "./db/index.js";
import {
  users,
  characters,
  relationships,
  messages,
  memoryChunks,
  offerwallRedemptions,
  iapReceipts,
  diaryEntries,
  characterMoments,
  momentReports,
  userFriendships,
} from "./db/schema-bindings.js";
import {
  syncUserStamina,
  claimDailyCheckin,
  formatStaminaDisplay,
} from "./services/user-economy.js";
import {
  claimOfferwallRewardVerified,
  clientIpFromRequest,
  isOfferwallVerificationRequired,
  isOfferwallWebhookIpAllowed,
  parseOfferwallAllowedIps,
  issueOfferwallClaimTicket,
} from "./services/offerwall-verify.js";
import {
  confirmUserAge,
  isAgeConfirmed,
  isAgeGateEnabled,
} from "./services/age-gate.js";
import { loadRecentTurns } from "./services/conversation-context.js";
import { getOwnedCharacter } from "./services/character-access.js";
import { assertCanCreateCharacter } from "./services/character-limit.js";
import {
  createVectorStore,
  resolveVectorStoreKind,
} from "./services/create-vector-store.js";
import {
  deleteMemoryById,
  deleteMemoryForCharacter,
  indexMessageAsMemory,
  listMemoriesForCharacter,
} from "./services/vector-store-db.js";
import {
  parseChatImage,
  imageMemoryText,
  imageLlmText,
  imageLlmTextWithVision,
} from "./services/chat-image.js";
import { formatMomentResponse } from "./services/moment-format.js";
import {
  MOMENT_VISIBILITY_VALUES,
  normalizeMomentVisibility,
} from "./services/moment-visibility.js";
import {
  MOMENT_REPORT_REASONS,
  submitMomentReport,
} from "./services/moment-report.js";
import { IAP_PRODUCTS } from "./services/iap-products.js";
import { requireAdmin } from "./services/admin-auth.js";
import {
  listHiddenMoments,
  restoreMoment,
} from "./services/moment-admin.js";
import {
  acceptFriendRequest,
  listAcceptedFriendUserIds,
  listFriendRequests,
  listFriends,
  sendFriendRequest,
} from "./services/friendship.js";
import {
  ensureUserInviteCode,
  findUserIdByInviteCode,
} from "./services/invite-code.js";
import {
  buildInviteUrl,
  resolvePublicWebBaseUrl,
} from "./services/invite-share.js";
import { buildInviteQrDataUrl } from "./services/invite-qr.js";
import {
  blockUser,
  listBlockedUsers,
  unblockUser,
} from "./services/user-block.js";
import { searchUsers } from "./services/user-search.js";
import { updateUserDisplayName } from "./services/display-name.js";
import { checkRateLimit, initRateLimitStore } from "./services/rate-limit.js";
import {
  getStoreCatalog,
  listStoreCatalogSummaries,
  localeToStoreMarket,
} from "./services/store-catalog.js";
import { getIapReadiness } from "./services/iap-readiness.js";
import { isJwtSecretConfigured } from "./services/runtime-config.js";
import { registerBodylessRequestFix } from "./bodyless-request.js";
import {
  getStoreListing,
  listStoreListingMarkets,
} from "./services/store-listing.js";
import { formatMessageForClient } from "./services/format-message.js";
import type { VectorStore } from "@huhu/ai";
import {
  affectionDeltaFromMessage,
  clampAffection,
  stageFromAffection,
} from "./services/relationship.js";
import { z } from "zod";
import { verifyReceiptAsync } from "./services/iap.js";
import { buildIapReceiptKey } from "./services/iap-receipt-key.js";
import { nextSubscriptionExpiry } from "./services/subscription.js";
import {
  shouldSummarizeMemory,
  persistMemorySummary,
} from "./services/memory-summary.js";
import { formatWebNovelExport } from "./services/export-conversation.js";

const localeSchema = z.enum(SUPPORTED_LOCALE_IDS);

const llm = createLlmProvider();
const embedFn = createEmbedFn();

export interface AppOptions {
  dbPath?: string;
  databaseUrl?: string;
  logger?: boolean;
  vectorStore?: VectorStore;
}

export async function buildApp(options: AppOptions = {}) {
  const appDatabaseUrl =
    options.databaseUrl ??
    (options.dbPath
      ? `file:${options.dbPath}`
      : process.env.DATABASE_URL?.trim());
  const dbHandle = await createDatabase({
    url: appDatabaseUrl,
    path: options.dbPath,
  });
  const { db, close: closeDb, driver: dbDriver, connectionLabel } = dbHandle;
  initRateLimitStore(db);
  let vectorStore: VectorStore;
  let closeVectorStore: (() => Promise<void>) | undefined;
  if (options.vectorStore) {
    vectorStore = options.vectorStore;
  } else {
    const handle = await createVectorStore(db, appDatabaseUrl);
    vectorStore = handle.store;
    closeVectorStore = handle.close;
  }

  const app = Fastify({ logger: options.logger ?? false });
  registerBodylessRequestFix(app);
  app.setErrorHandler((err, _req, reply) => {
    if (err instanceof z.ZodError) {
      const issue = err.issues[0];
      const code =
        issue?.message && /^[a-z0-9_]+$/.test(issue.message)
          ? issue.message
          : "validation_failed";
      return reply.status(400).send({ error: code });
    }
    throw err;
  });
  app.addHook("onClose", async () => {
    closeDb();
    await closeVectorStore?.();
  });
  await app.register(cors, { origin: true });

  app.get("/v1/pricing", async (req) => {
    const region = ((req.query as { region?: string }).region ??
      "TW") as PricingRegion;
    const valid = ["US", "JP", "TW", "VN", "KR", "CN"] as const;
    const r = valid.includes(region as (typeof valid)[number])
      ? region
      : "TW";
    return {
      region: r,
      tiers: getPricing(r as PricingRegion),
      usdBaseline: getUsdBaseline(),
    };
  });

  app.get("/health", async () => ({
    status: "ok",
    bundleId: "com.ctrlz.huhu",
    version: "0.1.0",
    publicMeta: PUBLIC_META_PATHS,
    economy: getEconomyMeta(),
    database: dbDriver,
    vectorStore:
      process.env.VECTOR_STORE === "sqlite"
        ? "sqlite"
        : resolveVectorStoreKind(dbDriver, appDatabaseUrl),
    llm: {
      provider: process.env.LLM_PROVIDER ?? "mock",
      hybridLlamaConfigured: Boolean(process.env.LLAMA_BASE_URL?.trim()),
      hybridCommercial: process.env.HYBRID_COMMERCIAL_PROVIDER ?? "openai",
    },
    moderation: {
      reportHideThreshold: Number(
        process.env.MOMENT_REPORT_HIDE_THRESHOLD ?? "3",
      ),
      adminApiConfigured: Boolean(process.env.ADMIN_API_KEY?.trim()),
    },
    rateLimit: {
      backend:
        process.env.RATE_LIMIT_BACKEND === "db" ||
        process.env.RATE_LIMIT_BACKEND === "postgres"
          ? "db"
          : "memory",
    },
    iap: getIapReadiness(),
    security: {
      jwtSecretConfigured: isJwtSecretConfigured(),
    },
    deployment: {
      storePublicSiteUrl: getStoreUrls().site,
    },
  }));

  app.get("/v1/admin/moments/hidden", async (req, reply) => {
    if (!requireAdmin(req, reply)) return;
    const limit = Math.min(
      100,
      Math.max(1, Number((req.query as { limit?: string }).limit ?? 30)),
    );
    const moments = await listHiddenMoments(db, limit);
    return { moments };
  });

  app.post("/v1/admin/moments/:momentId/restore", async (req, reply) => {
    if (!requireAdmin(req, reply)) return;
    const { momentId } = req.params as { momentId: string };
    const result = await restoreMoment(db, momentId);
    if (!result.ok) {
      const code = result.error === "moment_not_found" ? 404 : 400;
      return reply.status(code).send({ error: result.error });
    }
    return { moment: result.moment };
  });

  app.get("/v1/meta/locales", async () => ({
    locales: SUPPORTED_LOCALES.map((l) => ({
      id: l.id,
      label: l.label,
      hint: localeHint(l.id),
    })),
  }));

  app.get("/v1/meta/ui-strings", async (req) => {
    const q = req.query as { locale?: string };
    const locale = q.locale
      ? normalizeClientLocale(q.locale)
      : "zh-TW";
    return { locale, strings: getUiStrings(locale) };
  });

  app.get("/v1/meta/default-character", async (req) => {
    const q = req.query as { locale?: string };
    const locale = q.locale
      ? normalizeClientLocale(q.locale)
      : "zh-TW";
    const preset = defaultPresetForLocale(locale);
    const greeting = tUi(locale, "defaultGreeting", { name: preset.name });
    return { locale, presetId: preset.id, preset, greeting };
  });

  app.get("/v1/meta/iap-products", async (req) => {
    const q = req.query as { platform?: string };
    const platform =
      q.platform === "ios" || q.platform === "android" || q.platform === "web"
        ? q.platform
        : undefined;
    const tiers = ["lite", "basic", "premium"] as const;
    const subscriptions = tiers.map((tier) => ({
      tier,
      productId: subscriptionProductIdForPlatform(tier, platform),
    }));
    const coinProducts = Object.entries(IAP_PRODUCTS)
      .filter((entry): entry is [string, Extract<IapGrant, { kind: "coins" }>] => {
        return entry[1].kind === "coins";
      })
      .map(([productId, grant]) => ({
        productId,
        kind: grant.kind,
        coins: grant.amount,
      }));
    return {
      subscriptions,
      products: [
        ...subscriptions.map(({ tier, productId }) => ({
          productId,
          kind: "subscription" as const,
          tier,
        })),
        ...coinProducts,
      ],
      momentReportReasons: [...MOMENT_REPORT_REASONS],
    };
  });

  app.get("/v1/meta/store-listings", async () => ({
    markets: listStoreListingMarkets(),
  }));

  app.get("/v1/meta/store-listing", async (req, reply) => {
    const market = String((req.query as { market?: string }).market ?? "tw");
    const listing = getStoreListing(market);
    if (!listing) {
      return reply.status(404).send({ error: "market_not_found", market });
    }
    return { listing };
  });

  app.get("/v1/meta/store-catalog", async (req, reply) => {
    const q = req.query as { market?: string; locale?: string };
    let market = q.market?.trim();
    if (!market && q.locale?.trim()) {
      market = localeToStoreMarket(normalizeClientLocale(q.locale)) ?? undefined;
    }
    if (market) {
      const catalog = getStoreCatalog(market);
      if (!catalog) {
        return reply.status(404).send({
          error: "market_not_found",
          market,
          ...(q.locale ? { locale: q.locale } : {}),
        });
      }
      return { catalog };
    }
    return { catalogs: listStoreCatalogSummaries() };
  });

  app.get("/v1/meta/iap-readiness", async () => ({
    readiness: getIapReadiness(),
  }));

  app.get("/v1/meta/play-api-probe", async () => {
    const { probeGooglePlayApiAccess } = await import(
      "./services/google-play-verify.js"
    );
    return { probe: await probeGooglePlayApiAccess() };
  });

  app.get("/v1/meta/economy", async () => ({
    economy: getEconomyMeta(),
  }));

  app.get("/v1/meta/offerwall", async () => ({
    offerwall: buildOfferwallClientMeta({
      verificationRequired: isOfferwallVerificationRequired(),
      webhookIpRestricted: parseOfferwallAllowedIps().length > 0,
    }),
  }));

  app.get("/v1/meta/client-config", async (req) => {
    const q = req.query as { locale?: string };
    const rawLocale = q.locale?.trim();
    const locale = rawLocale
      ? normalizeClientLocale(rawLocale)
      : ("zh-TW" as const);
    return {
      config: {
        ...buildClientConfigMeta(rawLocale, {
          verificationRequired: isOfferwallVerificationRequired(),
          webhookIpRestricted: parseOfferwallAllowedIps().length > 0,
        }),
        subscriptionTiers: buildSubscriptionTierCatalog().map((entry) => ({
          ...entry,
          tierDisplayName: formatSubscriptionTierDisplayName(
            locale,
            entry.tier,
          ),
          entitlementsLabel: formatTierEntitlementsLabel(
            locale,
            entry.entitlements,
          ),
        })),
        subscriptionTiersPrompt: formatSubscriptionTiersPrompt(locale),
        apiErrors: buildApiErrorsMeta(locale),
      },
    };
  });

  app.get("/v1/meta/support-resources", async (req) => {
    const q = req.query as { locale?: string };
    return { resources: getSupportResources(q.locale?.trim()) };
  });

  app.post("/v1/webhooks/offerwall", async (req, reply) => {
    const clientIp = clientIpFromRequest(req);
    if (!isOfferwallWebhookIpAllowed(clientIp)) {
      return reply.status(403).send({ error: "offerwall_ip_forbidden" });
    }
    const body = z
      .object({
        userId: z.string().min(1),
        transactionId: z.string().min(1),
        timestamp: z.string().min(1),
        signature: z.string().min(1),
      })
      .parse(req.body);
    const result = await claimOfferwallRewardVerified(db, body.userId, body);
    if (!result.ok) {
      const status =
        result.reason === "transaction_already_redeemed" ? 409 : 401;
      return reply.status(status).send({ error: result.reason });
    }
    return result;
  });

  app.post("/v1/users/bootstrap", async () => {
    const id = nanoid();
    const now = new Date().toISOString();
    await db.insert(users).values({
      id,
      displayName: "Guest",
      locale: "zh-TW",
      subscriptionTier: "free",
      stamina: STAMINA_MAX,
      staminaUpdatedAt: now,
      coins: 20,
      createdAt: now,
    });
    await ensureUserInviteCode(db, id);
    const token = await signAccessToken(id);
    return { userId: id, token };
  });

  await app.register(async (protectedRoutes) => {
    protectedRoutes.addHook("preHandler", requireAuth);

    protectedRoutes.get("/v1/users/me", async (req, reply) => {
      const user = await syncUserStamina(db, req.userId!);
      if (!user) return reply.status(404).send({ error: "user_not_found" });
      const inviteCode = await ensureUserInviteCode(db, req.userId!);
      const webBase = resolvePublicWebBaseUrl(
        process.env.PUBLIC_WEB_URL,
        req.headers.host,
      );
      const inviteLink = buildInviteUrl(webBase, inviteCode);
      return {
        ...formatUserResponse(user),
        inviteCode,
        ...(inviteLink ? { inviteLink } : {}),
      };
    });

    protectedRoutes.patch("/v1/users/me/locale", async (req, reply) => {
      const body = z.object({ locale: localeSchema }).parse(req.body);
      await db
        .update(users)
        .set({ locale: body.locale })
        .where(eq(users.id, req.userId!));
      const user = await syncUserStamina(db, req.userId!);
      if (!user) return reply.status(404).send({ error: "user_not_found" });
      return formatUserResponse(user);
    });

    protectedRoutes.patch("/v1/users/me/display-name", async (req, reply) => {
      const body = z
        .object({ displayName: z.string().min(1).max(64) })
        .parse(req.body);
      const result = await updateUserDisplayName(
        db,
        req.userId!,
        body.displayName,
      );
      if (!result.ok) {
        const code =
          result.error === "user_not_found"
            ? 404
            : 400;
        return reply.status(code).send({ error: result.error });
      }
      const user = await syncUserStamina(db, req.userId!);
      if (!user) return reply.status(404).send({ error: "user_not_found" });
      return {
        ...formatUserResponse(user),
        displayName: result.displayName,
      };
    });

    protectedRoutes.patch("/v1/users/me/dev-economy", async (req, reply) => {
      if (process.env.NODE_ENV === "production") {
        return reply.status(403).send({ error: "dev_only" });
      }
      const body = z
        .object({
          stamina: z.number().int().min(0).max(STAMINA_MAX).optional(),
          coins: z.number().int().min(0).max(999_999).optional(),
        })
        .parse(req.body);
      if (body.stamina === undefined && body.coins === undefined) {
        return reply.status(400).send({ error: "validation_failed" });
      }
      const now = new Date().toISOString();
      await db
        .update(users)
        .set({
          ...(body.stamina !== undefined
            ? { stamina: body.stamina, staminaUpdatedAt: now }
            : {}),
          ...(body.coins !== undefined ? { coins: body.coins } : {}),
        })
        .where(eq(users.id, req.userId!));
      const user = await syncUserStamina(db, req.userId!);
      if (!user) return reply.status(404).send({ error: "user_not_found" });
      return formatUserResponse(user);
    });

    protectedRoutes.get("/v1/users/search", async (req, reply) => {
      const limitMax = Number(process.env.USER_SEARCH_RATE_LIMIT ?? "60");
      const max =
        Number.isFinite(limitMax) && limitMax > 0
          ? Math.min(200, Math.floor(limitMax))
          : 60;
      if (
        !(await checkRateLimit(
          `user-search:${req.userId!}`,
          max,
          60 * 60 * 1000,
        ))
      ) {
        return reply.status(429).send({ error: "rate_limited" });
      }
      const q = String((req.query as { q?: string }).q ?? "").trim();
      if (q.length < 2) {
        return reply.status(400).send({ error: "query_too_short" });
      }
      const results = await searchUsers(db, req.userId!, q);
      return { results };
    });

    protectedRoutes.get("/v1/users/:userId/characters", async (req, reply) => {
      const { userId } = req.params as { userId: string };
      if (userId !== req.userId) {
        return reply.status(403).send({ error: "forbidden" });
      }
      const rows = await db
        .select()
        .from(characters)
        .where(eq(characters.userId, userId));
      return { characters: rows };
    });

    protectedRoutes.post("/v1/users/me/age-confirm", async (req, reply) => {
      const body = z
        .object({ birthYear: z.number().int().min(1900).max(2100) })
        .parse(req.body);
      const result = await confirmUserAge(db, req.userId!, body.birthYear);
      if (!result.ok) {
        return reply.status(400).send({ error: result.reason });
      }
      const user = await syncUserStamina(db, req.userId!);
      return {
        ageConfirmed: true,
        ageConfirmedAt: result.ageConfirmedAt,
        economy: formatUserResponse(user!),
      };
    });

    protectedRoutes.post("/v1/rewards/offerwall/prepare", async (req) => {
      return issueOfferwallClaimTicket(req.userId!);
    });

    protectedRoutes.post("/v1/rewards/offerwall", async (req, reply) => {
      const body = z
        .object({
          transactionId: z.string().optional(),
          timestamp: z.string().optional(),
          signature: z.string().optional(),
        })
        .parse((req.body as object | undefined) ?? {});
      const result = await claimOfferwallRewardVerified(
        db,
        req.userId!,
        body,
      );
      if (!result.ok) {
        const status =
          result.reason === "offerwall_daily_cap" ||
          result.reason === "transaction_already_redeemed"
            ? 429
            : result.reason === "offerwall_signature_required" ||
                result.reason === "invalid_signature" ||
                result.reason === "timestamp_expired"
              ? 401
              : 400;
        return reply.status(status).send({ error: result.reason });
      }
      return result;
    });

    protectedRoutes.post("/v1/rewards/daily-checkin", async (req, reply) => {
      const result = await claimDailyCheckin(db, req.userId!);
      if (!result.ok) {
        return reply.status(409).send({ error: result.reason });
      }
      const user = await syncUserStamina(db, req.userId!);
      return {
        ...result,
        economy: formatUserResponse(user!),
      };
    });

    protectedRoutes.post("/v1/iap/verify", async (req, reply) => {
      const body = z
        .object({
          platform: z.enum(["ios", "android", "web"]),
          productId: z.string().min(1),
          receipt: z.string().min(1),
          transactionId: z.string().min(1).max(256).optional(),
        })
        .parse(req.body);

      const verified = await verifyReceiptAsync(body);
      if (!verified.ok) {
        return reply.status(400).send({ error: verified.reason });
      }

      const userId = req.userId!;
      const receiptKey = buildIapReceiptKey({
        platform: body.platform,
        receipt: body.receipt,
        productId: body.productId,
        transactionId: body.transactionId,
      });
      const existing = await db
        .select({
          receiptKey: iapReceipts.receiptKey,
          userId: iapReceipts.userId,
        })
        .from(iapReceipts)
        .where(eq(iapReceipts.receiptKey, receiptKey))
        .limit(1);
      if (existing.length > 0) {
        if (existing[0]!.userId !== userId) {
          return reply.status(409).send({ error: "receipt_already_redeemed" });
        }
        const user = await syncUserStamina(db, userId);
        return {
          ok: true,
          duplicate: true,
          grant: verified.grant,
          bonusCoins: 0,
          economy: formatUserResponse(user!),
        };
      }
      const user = await getUser(db, userId);
      if (!user) return reply.status(404).send({ error: "user_not_found" });

      let subscriptionTier = user.subscriptionTier as SubscriptionTier;
      let coins = user.coins;

      let subscriptionExpiresAt = user.subscriptionExpiresAt;
      if (verified.grant.kind === "subscription") {
        subscriptionTier = verified.grant.tier;
        coins += verified.bonusCoins;
        subscriptionExpiresAt = nextSubscriptionExpiry(
          user.subscriptionExpiresAt,
        );
      } else {
        coins += verified.grant.amount;
      }

      await db
        .update(users)
        .set({ subscriptionTier, coins, subscriptionExpiresAt })
        .where(eq(users.id, userId));

      await db.insert(iapReceipts).values({
        receiptKey,
        userId,
        productId: body.productId,
        platform: body.platform,
        createdAt: new Date().toISOString(),
      });

      const updated = await syncUserStamina(db, userId);
      return {
        grant: verified.grant,
        bonusCoins: verified.bonusCoins,
        economy: formatUserResponse(updated!),
      };
    });

    protectedRoutes.patch("/v1/users/me/subscription", async (req, reply) => {
      const allowDevOverrides = process.env.NODE_ENV !== "production";
      const body = z
        .object({
          tier: z.enum(SUBSCRIPTION_TIERS),
          expiresAt: z.string().datetime().optional(),
          stamina: z.number().int().min(0).max(STAMINA_MAX).optional(),
        })
        .parse(req.body);
      if (body.tier === "free") {
        return reply.status(400).send({ error: "use_data_delete_for_reset" });
      }
      if (
        !allowDevOverrides &&
        (body.expiresAt !== undefined || body.stamina !== undefined)
      ) {
        return reply.status(403).send({ error: "dev_subscription_fields_forbidden" });
      }
      const now = new Date().toISOString();
      await db
        .update(users)
        .set({
          subscriptionTier: body.tier,
          subscriptionExpiresAt:
            body.expiresAt ?? nextSubscriptionExpiry(null),
          ...(body.stamina !== undefined
            ? { stamina: body.stamina, staminaUpdatedAt: now }
            : {}),
        })
        .where(eq(users.id, req.userId!));
      const user = await syncUserStamina(db, req.userId!);
      return formatUserResponse(user!);
    });

    protectedRoutes.get("/v1/characters/presets", async () => {
      return { presets: CHARACTER_PRESETS };
    });

    protectedRoutes.post("/v1/characters/from-preset", async (req, reply) => {
      const body = z
        .object({
          presetId: z.string(),
          locale: localeSchema.optional(),
        })
        .parse(req.body);
      const preset = getPreset(body.presetId);
      if (!preset) {
        return reply.status(404).send({ error: "preset_not_found" });
      }
      const userId = req.userId!;
      const user = await getUser(db, userId);
      if (!user) return reply.status(404).send({ error: "user_not_found" });
      const slot = await assertCanCreateCharacter(
        db,
        userId,
        user.subscriptionTier,
      );
      if (!slot.ok) {
        return reply.status(403).send({
          error: "character_limit_reached",
          limit: slot.limit,
        });
      }
      const id = nanoid();
      const now = new Date().toISOString();
      await db.insert(characters).values({
        id,
        userId,
        name: preset.name,
        gender: preset.gender,
        personality: preset.personality,
        backstory: preset.backstory,
        speakingStyle: preset.speakingStyle,
        locale: body.locale ?? preset.locale,
        createdAt: now,
      });
      await db.insert(relationships).values({
        characterId: id,
        affection: 0,
        stage: "stranger",
        updatedAt: now,
      });
      return { characterId: id, presetId: preset.id };
    });

    protectedRoutes.post("/v1/characters", async (req, reply) => {
    const body = z
      .object({
        name: z.string().min(1).max(64),
        gender: z.string().optional(),
        personality: z.string().min(1).max(500),
        backstory: z.string().min(1).max(2000),
        speakingStyle: z.string().min(1).max(500),
        locale: localeSchema.default("zh-TW"),
      })
      .parse(req.body);

    const userId = req.userId!;
    const user = await getUser(db, userId);
    if (!user) return reply.status(404).send({ error: "user_not_found" });

    const slot = await assertCanCreateCharacter(
      db,
      userId,
      user.subscriptionTier,
    );
    if (!slot.ok) {
      return reply.status(403).send({
        error: "character_limit_reached",
        limit: slot.limit,
      });
    }

    const id = nanoid();
    const now = new Date().toISOString();
    await db.insert(characters).values({
      id,
      userId,
      name: body.name,
      gender: body.gender,
      personality: body.personality,
      backstory: body.backstory,
      speakingStyle: body.speakingStyle,
      locale: body.locale,
      createdAt: now,
    });
    await db.insert(relationships).values({
      characterId: id,
      affection: 0,
      stage: "stranger",
      updatedAt: now,
    });

    return { characterId: id };
  });

    protectedRoutes.get("/v1/characters/:characterId", async (req, reply) => {
    const { characterId } = req.params as { characterId: string };
    const char = await getOwnedCharacter(db, characterId, req.userId!);
    if (!char) return reply.status(404).send({ error: "character_not_found" });

    const rel = await db
      .select()
      .from(relationships)
      .where(eq(relationships.characterId, characterId))
      .limit(1);

    const relationship = rel[0];
    const viewer = await getUser(db, req.userId!);
    return {
      ...char,
      relationship: relationship
        ? formatRelationship(relationship, viewer?.locale)
        : null,
    };
  });

    protectedRoutes.get(
      "/v1/characters/:characterId/export",
      async (req, reply) => {
        const { characterId } = req.params as { characterId: string };
        const char = await getOwnedCharacter(db, characterId, req.userId!);
        if (!char) return reply.status(404).send({ error: "character_not_found" });

        const format =
          (req.query as { format?: string }).format ?? "webnovel";
        if (format !== "webnovel") {
          return reply.status(400).send({ error: "unsupported_format" });
        }

        const relRows = await db
          .select()
          .from(relationships)
          .where(eq(relationships.characterId, characterId))
          .limit(1);
        const rel = relRows[0];

        const rows = await db
          .select()
          .from(messages)
          .where(eq(messages.characterId, characterId))
          .orderBy(desc(messages.createdAt))
          .limit(200);

        const markdown = formatWebNovelExport(
          { name: char.name, locale: char.locale },
          rows.reverse().map((row) => {
            const formatted = formatMessageForClient(row);
            const safety = formatted.safety as
              | { category?: string }
              | undefined;
            return {
              role: row.role,
              content: row.content,
              createdAt: row.createdAt,
              safetyCategory: safety?.category,
              characterCorrected: formatted.characterCorrected === true,
            };
          }),
          (rel?.stage ?? "stranger") as import("@huhu/shared").RelationshipStage,
        );

        return { format: "webnovel", markdown };
      },
    );

    protectedRoutes.get(
      "/v1/characters/:characterId/diary",
      async (req, reply) => {
        const { characterId } = req.params as { characterId: string };
        const char = await getOwnedCharacter(db, characterId, req.userId!);
        if (!char) return reply.status(404).send({ error: "character_not_found" });
        const limit = Math.min(
          50,
          Math.max(1, Number((req.query as { limit?: string }).limit ?? 20)),
        );
        const rows = await db
          .select()
          .from(diaryEntries)
          .where(eq(diaryEntries.characterId, characterId))
          .orderBy(desc(diaryEntries.createdAt))
          .limit(limit);
        return { entries: rows };
      },
    );

    protectedRoutes.post(
      "/v1/characters/:characterId/diary",
      async (req, reply) => {
        const { characterId } = req.params as { characterId: string };
        const char = await getOwnedCharacter(db, characterId, req.userId!);
        if (!char) return reply.status(404).send({ error: "character_not_found" });
        const body = z
          .object({
            title: z.string().max(120).optional(),
            body: z.string().min(1).max(8000),
            mood: z.string().max(32).optional(),
          })
          .parse(req.body);
        const id = nanoid();
        const now = new Date().toISOString();
        await db.insert(diaryEntries).values({
          id,
          characterId,
          title: body.title ?? null,
          body: body.body,
          mood: body.mood ?? null,
          createdAt: now,
        });
        if (body.body.length >= 12) {
          await indexMessageAsMemory(
            vectorStore,
            characterId,
            `[日記] ${body.title ? `${body.title}: ` : ""}${body.body}`,
            `diary-${id}`,
            2,
          );
        }
        return reply.status(201).send({
          entry: {
            id,
            characterId,
            title: body.title ?? null,
            body: body.body,
            mood: body.mood ?? null,
            createdAt: now,
          },
        });
      },
    );

    protectedRoutes.patch(
      "/v1/characters/:characterId/diary/:entryId",
      async (req, reply) => {
        const { characterId, entryId } = req.params as {
          characterId: string;
          entryId: string;
        };
        const char = await getOwnedCharacter(db, characterId, req.userId!);
        if (!char) return reply.status(404).send({ error: "character_not_found" });
        const body = z
          .object({
            title: z.string().max(120).optional(),
            body: z.string().min(1).max(8000).optional(),
            mood: z.string().max(32).optional(),
          })
          .parse(req.body);
        const rows = await db
          .select()
          .from(diaryEntries)
          .where(eq(diaryEntries.id, entryId))
          .limit(1);
        const existing = rows[0];
        if (!existing || existing.characterId !== characterId) {
          return reply.status(404).send({ error: "diary_not_found" });
        }
        const nextBody = body.body ?? existing.body;
        const nextTitle =
          body.title !== undefined ? body.title : existing.title;
        const nextMood = body.mood !== undefined ? body.mood : existing.mood;
        await db
          .update(diaryEntries)
          .set({
            title: nextTitle,
            body: nextBody,
            mood: nextMood,
          })
          .where(eq(diaryEntries.id, entryId));
        await deleteMemoryById(vectorStore, `diary-${entryId}`);
        if (nextBody.length >= 12) {
          await indexMessageAsMemory(
            vectorStore,
            characterId,
            `[日記] ${nextTitle ? `${nextTitle}: ` : ""}${nextBody}`,
            `diary-${entryId}`,
            2,
          );
        }
        return {
          entry: {
            id: entryId,
            characterId,
            title: nextTitle,
            body: nextBody,
            mood: nextMood,
            createdAt: existing.createdAt,
          },
        };
      },
    );

    protectedRoutes.delete(
      "/v1/characters/:characterId/diary/:entryId",
      async (req, reply) => {
        const { characterId, entryId } = req.params as {
          characterId: string;
          entryId: string;
        };
        const char = await getOwnedCharacter(db, characterId, req.userId!);
        if (!char) return reply.status(404).send({ error: "character_not_found" });
        const rows = await db
          .select()
          .from(diaryEntries)
          .where(eq(diaryEntries.id, entryId))
          .limit(1);
        const existing = rows[0];
        if (!existing || existing.characterId !== characterId) {
          return reply.status(404).send({ error: "diary_not_found" });
        }
        await db.delete(diaryEntries).where(eq(diaryEntries.id, entryId));
        await deleteMemoryById(vectorStore, `diary-${entryId}`);
        return reply.status(204).send();
      },
    );

    protectedRoutes.get(
      "/v1/characters/:characterId/moments",
      async (req, reply) => {
        const { characterId } = req.params as { characterId: string };
        const char = await getOwnedCharacter(db, characterId, req.userId!);
        if (!char) return reply.status(404).send({ error: "character_not_found" });
        const limit = Math.min(
          50,
          Math.max(1, Number((req.query as { limit?: string }).limit ?? 20)),
        );
        const rows = await db
          .select()
          .from(characterMoments)
          .where(eq(characterMoments.characterId, characterId))
          .orderBy(desc(characterMoments.createdAt))
          .limit(limit);
        return {
          moments: rows.map((m) => formatMomentResponse(m)),
        };
      },
    );

    protectedRoutes.get("/v1/feed/moments", async (req) => {
      const userId = req.userId!;
      const limit = Math.min(
        50,
        Math.max(1, Number((req.query as { limit?: string }).limit ?? 30)),
      );
      const rows = await db
        .select({
          id: characterMoments.id,
          characterId: characterMoments.characterId,
          body: characterMoments.body,
          mediaJson: characterMoments.mediaJson,
          visibility: characterMoments.visibility,
          createdAt: characterMoments.createdAt,
          characterName: characters.name,
        })
        .from(characterMoments)
        .innerJoin(
          characters,
          eq(characterMoments.characterId, characters.id),
        )
        .where(eq(characters.userId, userId))
        .orderBy(desc(characterMoments.createdAt))
        .limit(limit);
      return {
        moments: rows.map((m) =>
          formatMomentResponse(m, m.characterName),
        ),
      };
    });

    protectedRoutes.get("/v1/feed/moments/friends", async (req) => {
      const userId = req.userId!;
      const limit = Math.min(
        50,
        Math.max(1, Number((req.query as { limit?: string }).limit ?? 30)),
      );
      const friendIds = await listAcceptedFriendUserIds(db, userId);
      if (friendIds.length === 0) {
        return { moments: [] };
      }
      const rows = await db
        .select({
          id: characterMoments.id,
          characterId: characterMoments.characterId,
          body: characterMoments.body,
          mediaJson: characterMoments.mediaJson,
          visibility: characterMoments.visibility,
          createdAt: characterMoments.createdAt,
          characterName: characters.name,
        })
        .from(characterMoments)
        .innerJoin(
          characters,
          eq(characterMoments.characterId, characters.id),
        )
        .where(
          and(
            eq(characterMoments.visibility, "friends"),
            eq(characterMoments.moderationStatus, "active"),
            inArray(characters.userId, friendIds),
          ),
        )
        .orderBy(desc(characterMoments.createdAt))
        .limit(limit);
      return {
        moments: rows.map((m) =>
          formatMomentResponse(m, m.characterName),
        ),
      };
    });

    protectedRoutes.get("/v1/feed/moments/public", async (req) => {
      const limit = Math.min(
        50,
        Math.max(1, Number((req.query as { limit?: string }).limit ?? 30)),
      );
      const rows = await db
        .select({
          id: characterMoments.id,
          characterId: characterMoments.characterId,
          body: characterMoments.body,
          mediaJson: characterMoments.mediaJson,
          visibility: characterMoments.visibility,
          createdAt: characterMoments.createdAt,
          characterName: characters.name,
        })
        .from(characterMoments)
        .innerJoin(
          characters,
          eq(characterMoments.characterId, characters.id),
        )
        .where(
          and(
            eq(characterMoments.visibility, "public"),
            eq(characterMoments.moderationStatus, "active"),
          ),
        )
        .orderBy(desc(characterMoments.createdAt))
        .limit(limit);
      return {
        moments: rows.map((m) =>
          formatMomentResponse(m, m.characterName),
        ),
      };
    });

    protectedRoutes.get("/v1/friends", async (req) => {
      const friends = await listFriends(db, req.userId!);
      return { friends };
    });

    protectedRoutes.get("/v1/friends/requests", async (req) => {
      return listFriendRequests(db, req.userId!);
    });

    protectedRoutes.post("/v1/friends/request", async (req, reply) => {
      const limitMax = Number(process.env.FRIEND_REQUEST_RATE_LIMIT ?? "30");
      const max =
        Number.isFinite(limitMax) && limitMax > 0
          ? Math.min(200, Math.floor(limitMax))
          : 30;
      if (
        !(await checkRateLimit(
          `friend-req:${req.userId!}`,
          max,
          60 * 60 * 1000,
        ))
      ) {
        return reply.status(429).send({ error: "rate_limited" });
      }
      const body = z
        .object({
          targetUserId: z.string().min(1).optional(),
          inviteCode: z.string().min(4).max(16).optional(),
        })
        .refine((b) => Boolean(b.targetUserId || b.inviteCode), {
          message: "target_required",
        })
        .refine((b) => !(b.targetUserId && b.inviteCode), {
          message: "one_target_only",
        })
        .parse(req.body);
      let targetUserId = body.targetUserId;
      if (body.inviteCode) {
        const resolved = await findUserIdByInviteCode(db, body.inviteCode);
        if (!resolved) {
          return reply.status(404).send({ error: "invite_code_not_found" });
        }
        targetUserId = resolved;
      }
      const result = await sendFriendRequest(
        db,
        req.userId!,
        targetUserId!,
      );
      if (!result.ok) {
        const code =
          result.error === "user_not_found"
            ? 404
            : result.error === "cannot_friend_self"
              ? 400
              : result.error === "blocked"
                ? 403
                : 409;
        return reply.status(code).send({ error: result.error });
      }
      return reply.status(201).send({
        friendship: result.friendship,
        autoAccepted: result.autoAccepted,
      });
    });

    protectedRoutes.get("/v1/users/me/invite-qr", async (req) => {
      const userId = req.userId!;
      const inviteCode = await ensureUserInviteCode(db, userId);
      const webBase = resolvePublicWebBaseUrl(
        process.env.PUBLIC_WEB_URL,
        req.headers.host,
      );
      const inviteLink = buildInviteUrl(webBase, inviteCode);
      const payload = inviteLink ?? inviteCode;
      const dataUrl = await buildInviteQrDataUrl(payload);
      return { dataUrl, payload };
    });

    protectedRoutes.get("/v1/blocks", async (req) => {
      const blocked = await listBlockedUsers(db, req.userId!);
      return { blocked };
    });

    protectedRoutes.post("/v1/blocks", async (req, reply) => {
      const body = z
        .object({ userId: z.string().min(1) })
        .parse(req.body);
      const result = await blockUser(db, req.userId!, body.userId);
      if (!result.ok) {
        const code =
          result.error === "user_not_found"
            ? 404
            : result.error === "cannot_block_self"
              ? 400
              : 409;
        return reply.status(code).send({ error: result.error });
      }
      return reply.status(201).send({ ok: true });
    });

    protectedRoutes.delete("/v1/blocks/:userId", async (req, reply) => {
      const { userId: blockedUserId } = req.params as { userId: string };
      const result = await unblockUser(db, req.userId!, blockedUserId);
      if (!result.ok) {
        return reply.status(404).send({ error: result.error });
      }
      return { ok: true };
    });

    protectedRoutes.post(
      "/v1/friends/:friendshipId/accept",
      async (req, reply) => {
        const { friendshipId } = req.params as { friendshipId: string };
        const result = await acceptFriendRequest(
          db,
          req.userId!,
          friendshipId,
        );
        if (!result.ok) {
          const code =
            result.error === "friendship_not_found"
              ? 404
              : result.error === "blocked"
                ? 403
                : 403;
          return reply.status(code).send({ error: result.error });
        }
        return { friendship: result.friendship };
      },
    );

    protectedRoutes.post(
      "/v1/feed/moments/:momentId/report",
      async (req, reply) => {
        const { momentId } = req.params as { momentId: string };
        const body = z
          .object({
            reason: z.enum(MOMENT_REPORT_REASONS),
          })
          .parse(req.body);
        const result = await submitMomentReport(
          db,
          momentId,
          req.userId!,
          body.reason,
        );
        if (!result.ok) {
          if (result.error === "moment_not_found") {
            return reply.status(404).send({ error: "moment_not_found" });
          }
          return reply.status(400).send({ error: "cannot_report_own" });
        }
        return reply.status(201).send({
          alreadyReported: result.alreadyReported,
          hidden: result.hidden,
          reportCount: result.reportCount,
        });
      },
    );

    protectedRoutes.post(
      "/v1/characters/:characterId/moments",
      async (req, reply) => {
        const { characterId } = req.params as { characterId: string };
        const char = await getOwnedCharacter(db, characterId, req.userId!);
        if (!char) return reply.status(404).send({ error: "character_not_found" });
        const body = z
          .object({
            body: z.string().min(1).max(2000),
            imageBase64: z.string().optional(),
            imageMimeType: z.string().optional(),
            visibility: z.enum(MOMENT_VISIBILITY_VALUES).optional(),
          })
          .parse(req.body);
        const visibility = normalizeMomentVisibility(body.visibility);
        let mediaJson: string | null = null;
        if (body.imageBase64) {
          const parsed = parseChatImage(body.imageBase64, body.imageMimeType);
          if (!parsed.ok) {
            return reply.status(400).send({ error: parsed.reason });
          }
          mediaJson = JSON.stringify({
            mimeType: parsed.mimeType,
            base64: parsed.base64,
          });
        }
        const id = nanoid();
        const now = new Date().toISOString();
        await db.insert(characterMoments).values({
          id,
          characterId,
          body: body.body,
          mediaJson,
          visibility,
          moderationStatus: "active",
          createdAt: now,
        });
        const memoryText = mediaJson
          ? `[動態] ${imageMemoryText(body.body)} ${body.body}`
          : `[動態] ${body.body}`;
        if (memoryText.length >= 12) {
          await indexMessageAsMemory(
            vectorStore,
            characterId,
            memoryText,
            `moment-${id}`,
            1,
          );
        }
        return reply.status(201).send({
          moment: formatMomentResponse(
            {
              id,
              characterId,
              body: body.body,
              mediaJson,
              visibility,
              createdAt: now,
            },
            char.name,
          ),
        });
      },
    );

    protectedRoutes.patch(
      "/v1/characters/:characterId/moments/:momentId",
      async (req, reply) => {
        const { characterId, momentId } = req.params as {
          characterId: string;
          momentId: string;
        };
        const char = await getOwnedCharacter(db, characterId, req.userId!);
        if (!char) return reply.status(404).send({ error: "character_not_found" });
        const patch = z
          .object({
            visibility: z.enum(MOMENT_VISIBILITY_VALUES),
          })
          .parse(req.body);
        const rows = await db
          .select()
          .from(characterMoments)
          .where(eq(characterMoments.id, momentId))
          .limit(1);
        const existing = rows[0];
        if (!existing || existing.characterId !== characterId) {
          return reply.status(404).send({ error: "moment_not_found" });
        }
        const visibility = normalizeMomentVisibility(patch.visibility);
        await db
          .update(characterMoments)
          .set({ visibility })
          .where(eq(characterMoments.id, momentId));
        return {
          moment: formatMomentResponse(
            { ...existing, visibility },
            char.name,
          ),
        };
      },
    );

    protectedRoutes.delete(
      "/v1/characters/:characterId/moments/:momentId",
      async (req, reply) => {
        const { characterId, momentId } = req.params as {
          characterId: string;
          momentId: string;
        };
        const char = await getOwnedCharacter(db, characterId, req.userId!);
        if (!char) return reply.status(404).send({ error: "character_not_found" });
        const rows = await db
          .select()
          .from(characterMoments)
          .where(eq(characterMoments.id, momentId))
          .limit(1);
        const existing = rows[0];
        if (!existing || existing.characterId !== characterId) {
          return reply.status(404).send({ error: "moment_not_found" });
        }
        await db
          .delete(momentReports)
          .where(eq(momentReports.momentId, momentId));
        await db
          .delete(characterMoments)
          .where(eq(characterMoments.id, momentId));
        await deleteMemoryById(vectorStore, `moment-${momentId}`);
        return reply.status(204).send();
      },
    );

    protectedRoutes.get("/v1/characters/:characterId/messages", async (req, reply) => {
    const { characterId } = req.params as { characterId: string };
    const char = await getOwnedCharacter(db, characterId, req.userId!);
    if (!char) return reply.status(404).send({ error: "character_not_found" });
    const limit = Number((req.query as { limit?: string }).limit ?? 50);
    const rows = await db
      .select()
      .from(messages)
      .where(eq(messages.characterId, characterId))
      .orderBy(desc(messages.createdAt))
      .limit(Math.min(limit, 100));
    return {
      messages: rows.reverse().map((row) => formatMessageForClient(row)),
    };
  });

    protectedRoutes.delete(
      "/v1/characters/:characterId/messages",
      async (req, reply) => {
        const { characterId } = req.params as { characterId: string };
        const char = await getOwnedCharacter(db, characterId, req.userId!);
        if (!char) return reply.status(404).send({ error: "character_not_found" });
        await db
          .delete(messages)
          .where(eq(messages.characterId, characterId));
        return { cleared: true };
      },
    );

    protectedRoutes.delete(
      "/v1/characters/:characterId/messages/:messageId",
      async (req, reply) => {
        const { characterId, messageId } = req.params as {
          characterId: string;
          messageId: string;
        };
        const char = await getOwnedCharacter(db, characterId, req.userId!);
        if (!char) return reply.status(404).send({ error: "character_not_found" });
        const rows = await db
          .select()
          .from(messages)
          .where(eq(messages.id, messageId))
          .limit(1);
        const row = rows[0];
        if (!row || row.characterId !== characterId) {
          return reply.status(404).send({ error: "message_not_found" });
        }
        await db.delete(messages).where(eq(messages.id, messageId));
        return { deleted: true, messageId };
      },
    );

    protectedRoutes.post(
      "/v1/characters/:characterId/relationship/reset",
      async (req, reply) => {
        const { characterId } = req.params as { characterId: string };
        const char = await getOwnedCharacter(db, characterId, req.userId!);
        if (!char) return reply.status(404).send({ error: "character_not_found" });
        const now = new Date().toISOString();
        await db
          .update(relationships)
          .set({ affection: 0, stage: "stranger", updatedAt: now })
          .where(eq(relationships.characterId, characterId));
        const viewer = await getUser(db, req.userId!);
        return {
          affection: 0,
          stage: "stranger",
          stageLabel: stageLabelForLocale("stranger", viewer?.locale),
        };
      },
    );

    protectedRoutes.get(
      "/v1/characters/:characterId/memories",
      async (req, reply) => {
        const { characterId } = req.params as { characterId: string };
        const char = await getOwnedCharacter(db, characterId, req.userId!);
        if (!char) return reply.status(404).send({ error: "character_not_found" });
        const limit = Math.min(
          100,
          Math.max(1, Number((req.query as { limit?: string }).limit) || 50),
        );
        const items = await listMemoriesForCharacter(db, characterId, limit);
        return { items };
      },
    );

    protectedRoutes.delete(
      "/v1/characters/:characterId/memories/:memoryId",
      async (req, reply) => {
        const { characterId, memoryId } = req.params as {
          characterId: string;
          memoryId: string;
        };
        const char = await getOwnedCharacter(db, characterId, req.userId!);
        if (!char) return reply.status(404).send({ error: "character_not_found" });
        const deleted = await deleteMemoryForCharacter(
          db,
          vectorStore,
          characterId,
          memoryId,
        );
        if (!deleted) return reply.status(404).send({ error: "memory_not_found" });
        return { deleted: true };
      },
    );

    protectedRoutes.delete(
      "/v1/characters/:characterId/memories",
      async (req, reply) => {
        const { characterId } = req.params as { characterId: string };
        const char = await getOwnedCharacter(db, characterId, req.userId!);
        if (!char) return reply.status(404).send({ error: "character_not_found" });
        if (vectorStore.deleteForCharacter) {
          await vectorStore.deleteForCharacter(characterId);
        } else {
          await db
            .delete(memoryChunks)
            .where(eq(memoryChunks.characterId, characterId));
        }
        return { cleared: true };
      },
    );

    protectedRoutes.post("/v1/chat", async (req, reply) => {
    const body = z
      .object({
        characterId: z.string(),
        content: z.string().max(8000).default(""),
        mode: z.enum(CHAT_MODES).default("simple"),
        messageType: z.enum(["text", "voice", "image"]).default("text"),
        voiceAudioBase64: z.string().max(8_000_000).optional(),
        voiceMimeType: z.string().max(128).optional(),
        imageBase64: z.string().max(3_000_000).optional(),
        imageMimeType: z.string().max(64).optional(),
      })
      .superRefine((data, ctx) => {
        const hasVoice = Boolean(data.voiceAudioBase64?.trim());
        const hasImage = Boolean(data.imageBase64?.trim());
        const hasText = Boolean(data.content.trim());
        if (!hasText && !hasVoice && !hasImage) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "content_required",
          });
        }
      })
      .parse(req.body);

    let userMediaJson: string | null = null;
    let imageVisionDescription: string | null = null;
    let userContent = body.content.trim();
    if (body.messageType === "image") {
      const parsed = parseChatImage(
        body.imageBase64,
        body.imageMimeType,
      );
      if (!parsed.ok) {
        return reply.status(400).send({ error: parsed.reason });
      }
      userMediaJson = JSON.stringify({
        mimeType: parsed.mimeType,
        data: parsed.base64,
      });
      const caption = body.content.trim();
      const vision = await describeChatImage(
        parsed.base64,
        parsed.mimeType,
      );
      if (vision.ok) {
        imageVisionDescription = vision.description;
        userContent = imageLlmTextWithVision(caption, vision.description);
      } else {
        userContent = imageLlmText(caption);
      }
    }

    if (body.messageType === "voice" && body.voiceAudioBase64?.trim()) {
      const stt = await transcribeVoiceAudio(
        body.voiceAudioBase64.trim(),
        body.voiceMimeType?.trim() || "audio/webm",
      );
      if (stt.ok) {
        userContent = stt.text;
      } else if (!userContent) {
        return reply.status(400).send({ error: stt.reason });
      }
    }
    if (!userContent) {
      return reply.status(400).send({ error: "content_required" });
    }

    const userId = req.userId!;
    const user = await syncUserStamina(db, userId);
    if (!user) return reply.status(404).send({ error: "user_not_found" });

    if (!isAgeConfirmed(user)) {
      return reply.status(403).send({
        error: "age_confirmation_required",
        ageGateEnabled: isAgeGateEnabled(),
      });
    }

    const character = await getOwnedCharacter(
      db,
      body.characterId,
      userId,
    );
    if (!character) {
      return reply.status(404).send({ error: "character_not_found" });
    }

    const safety = checkMessageSafety(userContent, user.locale ?? undefined);
    if (
      safety.flagged &&
      (safety.category === "crisis" || safety.category === "wellness")
    ) {
      const now = new Date().toISOString();
      const assistantAt = new Date(Date.now() + 1).toISOString();
      const userMsgId = nanoid();
      const assistantMsgId = nanoid();
      const resourceContent = safety.resourceMessage ?? "";
      await db.insert(messages).values([
        {
          id: userMsgId,
          characterId: body.characterId,
          role: "user",
          content: userContent,
          mode: body.mode,
          mediaJson: null,
          createdAt: now,
        },
        {
          id: assistantMsgId,
          characterId: body.characterId,
          role: "assistant",
          content: resourceContent,
          mode: "simple",
          mediaJson: JSON.stringify({ safety: { category: safety.category } }),
          createdAt: assistantAt,
        },
      ]);
      return {
        safety: safety,
        userMessageId: userMsgId,
        reply: {
          id: assistantMsgId,
          content: resourceContent,
          role: "assistant",
        },
        economy: formatUserResponse(user),
      };
    }

    const tier = user.subscriptionTier as SubscriptionTier;

    if (body.messageType === "voice" && !canUseVoice(tier)) {
      return reply.status(403).send({
        error: "voice_requires_basic_subscription",
        economy: formatUserResponse(user),
      });
    }

    const staminaCost =
      body.messageType === "voice"
        ? STAMINA_COST_VOICE
        : body.messageType === "image"
          ? STAMINA_COST_IMAGE
          : STAMINA_COST_TEXT;

    const staminaCheck = canSpendStamina(
      {
        current: user.stamina,
        updatedAt: new Date(user.staminaUpdatedAt),
      },
      staminaCost,
      tier,
    );
    if (!staminaCheck.ok) {
      return reply.status(402).send({
        error: staminaCheck.reason,
        economy: formatUserResponse(user),
      });
    }

    const coinCheck = canSpendCoins(user.coins, body.mode as ChatMode);
    if (!coinCheck.ok) {
      return reply.status(402).send({
        error: coinCheck.reason,
        economy: { coins: user.coins, cost: coinCheck.cost },
      });
    }

    let relRows = await db
      .select()
      .from(relationships)
      .where(eq(relationships.characterId, body.characterId))
      .limit(1);
    if (!relRows[0]) {
      const now = new Date().toISOString();
      await db.insert(relationships).values({
        characterId: body.characterId,
        affection: 0,
        stage: "stranger",
        updatedAt: now,
      });
      relRows = await db
        .select()
        .from(relationships)
        .where(eq(relationships.characterId, body.characterId))
        .limit(1);
    }
    const rel = relRows[0]!;

    const memoryLimit = memoryRetrievalLimit(tier);
    const memories = await retrieveMemories(
      vectorStore,
      body.characterId,
      userContent,
      memoryLimit,
      embedFn,
    );

    const systemPrompt = buildSystemPrompt(
      {
        name: character.name,
        personality: character.personality,
        backstory: character.backstory,
        speakingStyle: character.speakingStyle,
        locale: character.locale,
      },
      rel.stage as import("@huhu/shared").RelationshipStage,
      memories,
      { premiumUnrestricted: hasPremiumContentTier(tier) },
    );

    const modelTier = selectModelTier(body.mode as ChatMode, tier);
    const scrubbed = scrubPii(userContent);
    const recentTurns = await loadRecentTurns(db, body.characterId, 12);
    const llmResponse = await llm.complete(
      {
        systemPrompt,
        userMessage: scrubbed,
        memories,
        recentTurns,
        mode: body.mode as ChatMode,
        locale: character.locale,
        maxTokens: maxReplyTokens(tier),
      },
      modelTier,
    );

    const guarded = guardCharacterReply(
      llmResponse.content,
      character.name,
      character.locale,
    );

    const now = new Date().toISOString();
    const userMsgId = nanoid();
    const assistantMsgId = nanoid();

    await db.insert(messages).values([
      {
        id: userMsgId,
        characterId: body.characterId,
        role: "user",
        content: userContent,
        mode: body.mode,
        mediaJson: userMediaJson,
        createdAt: now,
      },
      {
        id: assistantMsgId,
        characterId: body.characterId,
        role: "assistant",
        content: guarded.content,
        mode: body.mode,
        mediaJson: guarded.corrected
          ? JSON.stringify({ characterGuard: { corrected: true } })
          : null,
        createdAt: now,
      },
    ]);

    const memorySnippet =
      body.messageType === "image"
        ? imageVisionDescription
          ? imageMemoryText(
              `${imageVisionDescription} ${body.content.trim()}`.trim(),
            )
          : imageMemoryText(body.content.trim())
        : userContent;
    if (
      (body.messageType === "image" || memorySnippet.length >= 12) &&
      !userContent.includes(MOCK_BREAK_CHARACTER_TRIGGER)
    ) {
      await indexMessageAsMemory(
        vectorStore,
        body.characterId,
        memorySnippet,
        `mem-${userMsgId}`,
        body.mode === "exciting" ? 2 : 1,
      );
    }

    const newAffection = clampAffection(
      rel.affection + affectionDeltaFromMessage(userContent, body.mode),
    );
    const newStage = stageFromAffection(newAffection);
    await db
      .update(relationships)
      .set({
        affection: newAffection,
        stage: newStage,
        updatedAt: now,
      })
      .where(eq(relationships.characterId, body.characterId));

    const newStamina = staminaCheck.state.current;
    const newCoins = user.coins - coinCheck.cost;
    await db
      .update(users)
      .set({
        stamina: newStamina,
        staminaUpdatedAt: staminaCheck.state.updatedAt.toISOString(),
        coins: newCoins,
      })
      .where(eq(users.id, userId));

    const allMsgs = await db
      .select({ role: messages.role, content: messages.content })
      .from(messages)
      .where(eq(messages.characterId, body.characterId));
    if (shouldSummarizeMemory(allMsgs.length)) {
      await persistMemorySummary(vectorStore, body.characterId, allMsgs);
    }

    const updatedUser = await getUser(db, userId);

    const replyPayload: Record<string, unknown> = {
      id: assistantMsgId,
      content: guarded.content,
      modelTier: llmResponse.modelTier,
      characterCorrected: guarded.corrected,
    };
    if (userMediaJson) {
      const media = JSON.parse(userMediaJson) as {
        mimeType: string;
        data: string;
      };
      replyPayload.userMedia = {
        mimeType: media.mimeType,
        imageBase64: media.data,
      };
    }
    if (body.messageType === "voice") {
      const voiceSynth = await synthesizeVoice(
        guarded.content,
        character.locale,
        newStage as import("@huhu/shared").RelationshipStage,
      );
      replyPayload.voice = voiceSynth
        ? {
            transcript: guarded.content,
            delivery: voiceSynth.provider,
            mimeType: voiceSynth.mimeType,
            audioBase64: voiceSynth.audioBase64,
          }
        : {
            transcript: guarded.content,
            delivery: "text_only",
          };
    }

    return {
      userMessageId: userMsgId,
      reply: replyPayload,
      relationship: formatRelationship(
        {
          affection: newAffection,
          stage: newStage,
        },
        user.locale,
      ),
      economy: formatUserResponse(updatedUser!),
    };
  });

    protectedRoutes.delete("/v1/users/me/data", async (req, reply) => {
    const userId = req.userId!;
    const user = await getUser(db, userId);
    if (!user) return reply.status(404).send({ error: "user_not_found" });

    const chars = await db
      .select({ id: characters.id })
      .from(characters)
      .where(eq(characters.userId, userId));

    await db.delete(iapReceipts).where(eq(iapReceipts.userId, userId));
    await db
      .delete(offerwallRedemptions)
      .where(eq(offerwallRedemptions.userId, userId));
    await db
      .delete(momentReports)
      .where(eq(momentReports.reporterUserId, userId));
    await db
      .delete(userFriendships)
      .where(
        or(
          eq(userFriendships.requesterUserId, userId),
          eq(userFriendships.addresseeUserId, userId),
        ),
      );
    for (const c of chars) {
      if (vectorStore.deleteForCharacter) {
        await vectorStore.deleteForCharacter(c.id);
      } else {
        await db.delete(memoryChunks).where(eq(memoryChunks.characterId, c.id));
      }
      await db.delete(messages).where(eq(messages.characterId, c.id));
      await db
        .delete(diaryEntries)
        .where(eq(diaryEntries.characterId, c.id));
      const charMoments = await db
        .select({ id: characterMoments.id })
        .from(characterMoments)
        .where(eq(characterMoments.characterId, c.id));
      for (const m of charMoments) {
        await db
          .delete(momentReports)
          .where(eq(momentReports.momentId, m.id));
      }
      await db
        .delete(characterMoments)
        .where(eq(characterMoments.characterId, c.id));
      await db
        .delete(relationships)
        .where(eq(relationships.characterId, c.id));
      await db.delete(characters).where(eq(characters.id, c.id));
    }
    await db.delete(users).where(eq(users.id, userId));
    return { deleted: true };
  });
  });

  const webRoot = join(
    dirname(fileURLToPath(import.meta.url)),
    "../../web",
  );

  const sendPublicHtml = (filename: string) => (_req: unknown, reply: { type: (t: string) => { send: (b: string) => unknown } }) => {
    const html = readFileSync(join(webRoot, filename), "utf8");
    return reply.type("text/html").send(html);
  };

  app.get("/support", sendPublicHtml("support.html"));
  app.get("/privacy", sendPublicHtml("privacy.html"));

  await app.register(fastifyStatic, {
    root: webRoot,
    prefix: "/",
    decorateReply: false,
  });

  return {
    app,
    db,
    dbPath: connectionLabel,
    dbDriver,
    closeDb,
    closeVectorStore,
  };
}

async function getUser(db: Db, userId: string) {
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return rows[0];
}

function formatRelationship(
  rel: {
    affection: number;
    stage: string;
  },
  locale?: string,
) {
  const stage = rel.stage as import("@huhu/shared").RelationshipStage;
  return {
    affection: rel.affection,
    stage,
    stageLabel: stageLabelForLocale(stage, locale),
    percent: affectionPercent(rel.affection),
  };
}

function formatUserResponse(user: typeof users.$inferSelect) {
  return {
    id: user.id,
    displayName: user.displayName,
    locale: user.locale,
    subscriptionTier: user.subscriptionTier,
    subscriptionTierDisplayName: formatSubscriptionTierDisplayName(
      user.locale,
      user.subscriptionTier as SubscriptionTier,
    ),
    subscriptionExpiresAt: user.subscriptionExpiresAt,
    stamina: user.stamina,
    staminaUpdatedAt: user.staminaUpdatedAt,
    staminaDisplay: formatStaminaDisplay(
      user.stamina,
      user.subscriptionTier,
    ),
    coins: user.coins,
    plan: buildUserPlan(user),
    ageConfirmed: isAgeConfirmed(user),
    ageGateRequired: isAgeGateEnabled(),
  };
}
