import { integer, pgTable, text, real } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  displayName: text("display_name").notNull(),
  locale: text("locale").notNull().default("zh-TW"),
  subscriptionTier: text("subscription_tier").notNull().default("free"),
  subscriptionExpiresAt: text("subscription_expires_at"),
  stamina: integer("stamina").notNull().default(50),
  staminaUpdatedAt: text("stamina_updated_at").notNull(),
  coins: integer("coins").notNull().default(0),
  offerwallClaimsDate: text("offerwall_claims_date"),
  offerwallClaimsCount: integer("offerwall_claims_count").notNull().default(0),
  dailyCheckinDate: text("daily_checkin_date"),
  subscriptionCoinsGrantMonth: text("subscription_coins_grant_month"),
  ageConfirmedAt: text("age_confirmed_at"),
  inviteCode: text("invite_code").unique(),
  createdAt: text("created_at").notNull(),
});

export const characters = pgTable("characters", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  name: text("name").notNull(),
  gender: text("gender"),
  personality: text("personality").notNull(),
  backstory: text("backstory").notNull(),
  speakingStyle: text("speaking_style").notNull(),
  locale: text("locale").notNull().default("zh-TW"),
  createdAt: text("created_at").notNull(),
});

export const relationships = pgTable("relationships", {
  characterId: text("character_id")
    .primaryKey()
    .references(() => characters.id),
  affection: integer("affection").notNull().default(0),
  stage: text("stage").notNull().default("stranger"),
  updatedAt: text("updated_at").notNull(),
});

export const messages = pgTable("messages", {
  id: text("id").primaryKey(),
  characterId: text("character_id")
    .notNull()
    .references(() => characters.id),
  role: text("role").notNull(),
  content: text("content").notNull(),
  mode: text("mode").notNull().default("simple"),
  mediaJson: text("media_json"),
  createdAt: text("created_at").notNull(),
});

export const offerwallRedemptions = pgTable("offerwall_redemptions", {
  transactionId: text("transaction_id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  createdAt: text("created_at").notNull(),
});

export const diaryEntries = pgTable("diary_entries", {
  id: text("id").primaryKey(),
  characterId: text("character_id")
    .notNull()
    .references(() => characters.id),
  title: text("title"),
  body: text("body").notNull(),
  mood: text("mood"),
  createdAt: text("created_at").notNull(),
});

export const characterMoments = pgTable("character_moments", {
  id: text("id").primaryKey(),
  characterId: text("character_id")
    .notNull()
    .references(() => characters.id),
  body: text("body").notNull(),
  mediaJson: text("media_json"),
  visibility: text("visibility").notNull().default("private"),
  moderationStatus: text("moderation_status").notNull().default("active"),
  createdAt: text("created_at").notNull(),
});

export const rateLimitBuckets = pgTable("rate_limit_buckets", {
  bucketKey: text("bucket_key").primaryKey(),
  count: integer("count").notNull(),
  resetAt: integer("reset_at").notNull(),
});

export const userBlocks = pgTable("user_blocks", {
  id: text("id").primaryKey(),
  blockerUserId: text("blocker_user_id")
    .notNull()
    .references(() => users.id),
  blockedUserId: text("blocked_user_id")
    .notNull()
    .references(() => users.id),
  createdAt: text("created_at").notNull(),
});

export const userFriendships = pgTable("user_friendships", {
  id: text("id").primaryKey(),
  requesterUserId: text("requester_user_id")
    .notNull()
    .references(() => users.id),
  addresseeUserId: text("addressee_user_id")
    .notNull()
    .references(() => users.id),
  status: text("status").notNull().default("pending"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const momentReports = pgTable("moment_reports", {
  id: text("id").primaryKey(),
  momentId: text("moment_id")
    .notNull()
    .references(() => characterMoments.id),
  reporterUserId: text("reporter_user_id")
    .notNull()
    .references(() => users.id),
  reason: text("reason").notNull(),
  createdAt: text("created_at").notNull(),
});

export const iapReceipts = pgTable("iap_receipts", {
  receiptKey: text("receipt_key").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  productId: text("product_id").notNull(),
  platform: text("platform").notNull(),
  createdAt: text("created_at").notNull(),
});

export const memoryChunks = pgTable("memory_chunks", {
  id: text("id").primaryKey(),
  characterId: text("character_id")
    .notNull()
    .references(() => characters.id),
  content: text("content").notNull(),
  embeddingJson: text("embedding_json").notNull(),
  importance: real("importance").notNull().default(1),
  createdAt: text("created_at").notNull(),
});
