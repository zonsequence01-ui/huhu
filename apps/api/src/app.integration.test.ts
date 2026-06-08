import { API_ERROR_CODES } from "@huhu/shared";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { eq } from "drizzle-orm";
import { buildApp } from "./app.js";
import { users, characters, memoryChunks } from "./db/schema-bindings.js";
import {
  authHeader,
  bootstrapTestUser,
  createTestCharacter,
} from "./test-helpers/integration-user.js";

async function firstOwnedCharacterId(
  built: Awaited<ReturnType<typeof buildApp>>,
  ownerId: string,
): Promise<string> {
  const rows = await built.db
    .select({ id: characters.id })
    .from(characters)
    .where(eq(characters.userId, ownerId))
    .limit(1);
  expect(rows.length).toBeGreaterThan(0);
  return rows[0]!.id;
}

describe("API integration", () => {
  let built: Awaited<ReturnType<typeof buildApp>>;
  let token: string;
  let userId: string;
  let tmpDir: string;

  beforeAll(async () => {
    tmpDir = mkdtempSync(join(tmpdir(), "huhu-test-"));
    built = await buildApp({ dbPath: join(tmpDir, "test.db") });
    await built.app.ready();

    const boot = await built.app.inject({
      method: "POST",
      url: "/v1/users/bootstrap",
    });
    const body = boot.json() as { userId: string; token: string };
    userId = body.userId;
    token = body.token;
    const sharedCharacterId = await createTestCharacter(
      built.app,
      token,
      "Shared",
    );
    const chat = await built.app.inject({
      method: "POST",
      url: "/v1/chat",
      headers: authHeader(token),
      payload: {
        characterId: sharedCharacterId,
        content: "integration seed",
        mode: "simple",
      },
    });
    expect(chat.statusCode).toBe(200);
  });

  afterAll(async () => {
    await built.app.close();
    built.closeDb();
    await built.closeVectorStore?.();
    await new Promise((r) => setTimeout(r, 50));
    try {
      rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      /* Windows sqlite lock */
    }
  });

  it("rejects unauthenticated chat", async () => {
    const res = await built.app.inject({
      method: "POST",
      url: "/v1/chat",
      payload: { characterId: "x", content: "hi" },
    });
    expect(res.statusCode).toBe(401);
  });

  it("bootstrap user, create character, chat flow", async () => {
    const { token: tok } = await bootstrapTestUser(built.app);
    const characterId = await createTestCharacter(built.app, tok, "小呼");

    const chat = await built.app.inject({
      method: "POST",
      url: "/v1/chat",
      headers: authHeader(tok),
      payload: {
        characterId,
        content: "我今天工作好累，但有點開心",
        mode: "simple",
      },
    });
    expect(chat.statusCode).toBe(200);
    const body = chat.json() as {
      userMessageId: string;
      reply: { id: string; content: string };
      relationship: { affection: number; percent: number; stageLabel: string };
    };
    expect(body.userMessageId.length).toBeGreaterThan(0);
    expect(body.reply.id.length).toBeGreaterThan(0);
    expect(body.reply.content.length).toBeGreaterThan(0);
    expect(body.relationship.affection).toBeGreaterThan(0);
    expect(body.relationship.stageLabel).toBeDefined();
  });

  it("resets relationship affection and stage", async () => {
    const { token: tok } = await bootstrapTestUser(built.app);
    const characterId = await createTestCharacter(built.app, tok, "ResetMe");

    const chat = await built.app.inject({
      method: "POST",
      url: "/v1/chat",
      headers: authHeader(tok),
      payload: { characterId, content: "今天心情很好", mode: "simple" },
    });
    expect(chat.statusCode).toBe(200);
    expect(
      (chat.json() as { relationship: { affection: number } }).relationship
        .affection,
    ).toBeGreaterThan(0);

    const reset = await built.app.inject({
      method: "POST",
      url: `/v1/characters/${characterId}/relationship/reset`,
      headers: authHeader(tok),
    });
    expect(reset.statusCode).toBe(200);
    const resetBody = reset.json() as {
      affection: number;
      stage: string;
      stageLabel: string;
    };
    expect(resetBody.affection).toBe(0);
    expect(resetBody.stage).toBe("stranger");

    const after = await built.app.inject({
      method: "POST",
      url: "/v1/chat",
      headers: authHeader(tok),
      payload: { characterId, content: "嗨", mode: "simple" },
    });
    expect(
      (after.json() as { relationship: { affection: number } }).relationship
        .affection,
    ).toBeGreaterThan(0);
    expect(
      (after.json() as { relationship: { affection: number } }).relationship
        .affection,
    ).toBeLessThan(
      (chat.json() as { relationship: { affection: number } }).relationship
        .affection + 5,
    );
  });

  it("returns localized stageLabel for user locale", async () => {
    const { token: tok } = await bootstrapTestUser(built.app);
    await built.app.inject({
      method: "PATCH",
      url: "/v1/users/me/locale",
      headers: authHeader(tok),
      payload: { locale: "en" },
    });
    const characterId = await createTestCharacter(built.app, tok, "EnStage");

    const reset = await built.app.inject({
      method: "POST",
      url: `/v1/characters/${characterId}/relationship/reset`,
      headers: authHeader(tok),
    });
    expect(reset.statusCode).toBe(200);
    expect((reset.json() as { stageLabel: string }).stageLabel).toBe("Stranger");

    const chat = await built.app.inject({
      method: "POST",
      url: "/v1/chat",
      headers: authHeader(tok),
      payload: { characterId, content: "hi", mode: "simple" },
    });
    expect(
      (chat.json() as { relationship: { stageLabel: string } }).relationship
        .stageLabel,
    ).toBe("Stranger");
  });

  it("returns crisis safety response", async () => {
    const { token: tok } = await bootstrapTestUser(built.app);
    const characterId = await createTestCharacter(built.app, tok, "Test");

    const chat = await built.app.inject({
      method: "POST",
      url: "/v1/chat",
      headers: authHeader(tok),
      payload: {
        characterId,
        content: "我不想活了",
        mode: "simple",
      },
    });
    const body = chat.json() as {
      safety: { flagged: boolean };
      userMessageId: string;
      reply: { id: string };
    };
    expect(body.safety.flagged).toBe(true);
    expect(body.userMessageId.length).toBeGreaterThan(0);
    expect(body.reply.id.length).toBeGreaterThan(0);
  });

  it("persists crisis safety exchange in message history", async () => {
    const { token: tok } = await bootstrapTestUser(built.app);
    const characterId = await createTestCharacter(built.app, tok, "Test");

    await built.app.inject({
      method: "POST",
      url: "/v1/chat",
      headers: authHeader(tok),
      payload: {
        characterId,
        content: "我不想活了",
        mode: "simple",
      },
    });

    const list = await built.app.inject({
      method: "GET",
      url: `/v1/characters/${characterId}/messages`,
      headers: authHeader(tok),
    });
    expect(list.statusCode).toBe(200);
    const body = list.json() as {
      messages: {
        role: string;
        content: string;
        safety?: { flagged: boolean; category: string };
      }[];
    };
    expect(body.messages).toHaveLength(2);
    const userMsg = body.messages.find((m) => m.role === "user");
    const assistantMsg = body.messages.find((m) => m.role === "assistant");
    expect(userMsg?.content).toContain("不想活");
    expect(assistantMsg?.safety?.flagged).toBe(true);
    expect(assistantMsg?.safety?.category).toBe("crisis");

    const exported = await built.app.inject({
      method: "GET",
      url: `/v1/characters/${characterId}/export?format=webnovel`,
      headers: authHeader(tok),
    });
    expect(exported.statusCode).toBe(200);
    const exportBody = exported.json() as { markdown: string };
    expect(exportBody.markdown).toContain("*(支援資源)*");
  });

  it("persists wellness safety exchange in message history", async () => {
    const { token: tok } = await bootstrapTestUser(built.app);
    const characterId = await createTestCharacter(built.app, tok, "Test");

    await built.app.inject({
      method: "POST",
      url: "/v1/chat",
      headers: authHeader(tok),
      payload: {
        characterId,
        content: "好抑鬱活著沒意思",
        mode: "simple",
      },
    });

    const list = await built.app.inject({
      method: "GET",
      url: `/v1/characters/${characterId}/messages`,
      headers: authHeader(tok),
    });
    expect(list.statusCode).toBe(200);
    const body = list.json() as {
      messages: {
        role: string;
        content: string;
        safety?: { flagged: boolean; category: string };
      }[];
    };
    expect(body.messages).toHaveLength(2);
    const assistantMsg = body.messages.find((m) => m.role === "assistant");
    expect(assistantMsg?.safety?.flagged).toBe(true);
    expect(assistantMsg?.safety?.category).toBe("wellness");
  });

  it("does not index wellness messages into RAG memory", async () => {
    const { token: tok } = await bootstrapTestUser(built.app);
    const characterId = await createTestCharacter(built.app, tok, "RagWellness");

    await built.app.inject({
      method: "POST",
      url: "/v1/chat",
      headers: authHeader(tok),
      payload: {
        characterId,
        content: "好抑鬱活著沒意思",
        mode: "simple",
      },
    });

    const chunks = await built.db
      .select({ content: memoryChunks.content })
      .from(memoryChunks)
      .where(eq(memoryChunks.characterId, characterId));
    expect(chunks.some((c) => c.content.includes("抑鬱"))).toBe(false);
  });

  it("clears RAG memory chunks for a character", async () => {
    const { token: tok } = await bootstrapTestUser(built.app);
    const characterId = await createTestCharacter(built.app, tok, "MemClear");

    await built.app.inject({
      method: "POST",
      url: "/v1/chat",
      headers: authHeader(tok),
      payload: {
        characterId,
        content: "我最喜歡週末去海邊散步看夕陽",
        mode: "simple",
      },
    });

    const before = await built.db
      .select({ id: memoryChunks.id })
      .from(memoryChunks)
      .where(eq(memoryChunks.characterId, characterId));
    expect(before.length).toBeGreaterThan(0);

    const cleared = await built.app.inject({
      method: "DELETE",
      url: `/v1/characters/${characterId}/memories`,
      headers: authHeader(tok),
    });
    expect(cleared.statusCode).toBe(200);
    expect((cleared.json() as { cleared: boolean }).cleared).toBe(true);

    const after = await built.db
      .select({ id: memoryChunks.id })
      .from(memoryChunks)
      .where(eq(memoryChunks.characterId, characterId));
    expect(after).toHaveLength(0);
  });

  it("lists and deletes a single RAG memory fragment", async () => {
    const { token: tok } = await bootstrapTestUser(built.app);
    const characterId = await createTestCharacter(built.app, tok, "MemOne");

    await built.app.inject({
      method: "POST",
      url: "/v1/chat",
      headers: authHeader(tok),
      payload: {
        characterId,
        content: "我最喜歡週末去海邊散步看夕陽",
        mode: "simple",
      },
    });

    const listed = await built.app.inject({
      method: "GET",
      url: `/v1/characters/${characterId}/memories`,
      headers: authHeader(tok),
    });
    expect(listed.statusCode).toBe(200);
    const items = (listed.json() as { items: { id: string; preview: string }[] })
      .items;
    expect(items.length).toBeGreaterThan(0);
    const targetId = items[0]!.id;

    const removed = await built.app.inject({
      method: "DELETE",
      url: `/v1/characters/${characterId}/memories/${targetId}`,
      headers: authHeader(tok),
    });
    expect(removed.statusCode).toBe(200);
    expect((removed.json() as { deleted: boolean }).deleted).toBe(true);

    const after = await built.app.inject({
      method: "GET",
      url: `/v1/characters/${characterId}/memories`,
      headers: authHeader(tok),
    });
    const remaining = (after.json() as { items: { id: string }[] }).items;
    expect(remaining.some((m) => m.id === targetId)).toBe(false);
  });

  it("scrubs PII before indexing chat into RAG memory", async () => {
    const { token: tok } = await bootstrapTestUser(built.app);
    const characterId = await createTestCharacter(built.app, tok, "PiiRag");

    await built.app.inject({
      method: "POST",
      url: "/v1/chat",
      headers: authHeader(tok),
      payload: {
        characterId,
        content: "請寄信到 secret.user@example.com 我會回覆你",
        mode: "simple",
      },
    });

    const chunks = await built.db
      .select({ content: memoryChunks.content })
      .from(memoryChunks)
      .where(eq(memoryChunks.characterId, characterId));
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks.some((c) => c.content.includes("secret.user@example.com"))).toBe(
      false,
    );
    expect(chunks.some((c) => c.content.includes("[EMAIL]"))).toBe(true);
  });

  it("deletes all account data and user record", async () => {
    const { userId: isoId, token: iso } = await bootstrapTestUser(built.app);
    const characterId = await createTestCharacter(built.app, iso, "WipeMe");

    await built.app.inject({
      method: "POST",
      url: "/v1/chat",
      headers: authHeader(iso),
      payload: {
        characterId,
        content: "我最喜歡週末去海邊散步看夕陽",
        mode: "simple",
      },
    });

    const del = await built.app.inject({
      method: "DELETE",
      url: "/v1/users/me/data",
      headers: authHeader(iso),
    });
    expect(del.statusCode).toBe(200);
    expect((del.json() as { deleted: boolean }).deleted).toBe(true);

    const me = await built.app.inject({
      method: "GET",
      url: "/v1/users/me",
      headers: authHeader(iso),
    });
    expect(me.statusCode).toBe(404);
    expect((me.json() as { error: string }).error).toBe("user_not_found");

    const charRows = await built.db
      .select({ id: characters.id })
      .from(characters)
      .where(eq(characters.userId, isoId));
    expect(charRows).toHaveLength(0);

    const memRows = await built.db
      .select({ id: memoryChunks.id })
      .from(memoryChunks)
      .where(eq(memoryChunks.characterId, characterId));
    expect(memRows).toHaveLength(0);
  });

  it("premium subscriber receives expanded memory entitlements", async () => {
    const { userId: isoId, token: iso } = await bootstrapTestUser(built.app);
    await built.app.inject({
      method: "POST",
      url: "/v1/iap/verify",
      headers: authHeader(iso),
      payload: {
        platform: "ios",
        productId: "com.ctrlz.huhu.sub.premium",
        receipt: `dev_stub:premium-ent-${isoId}`,
      },
    });
    const me = await built.app.inject({
      method: "GET",
      url: "/v1/users/me",
      headers: authHeader(iso),
    });
    expect(me.statusCode).toBe(200);
    const body = me.json() as {
      subscriptionTier: string;
      plan: {
        entitlements: {
          memoryRetrievalLimit: number;
          maxReplyTokens: number;
        };
      };
    };
    expect(body.subscriptionTier).toBe("premium");
    expect(body.plan.entitlements.memoryRetrievalLimit).toBe(20);
    expect(body.plan.entitlements.maxReplyTokens).toBeGreaterThan(512);
  });

  it("does not index crisis messages into RAG memory", async () => {
    const { token: tok } = await bootstrapTestUser(built.app);
    const characterId = await createTestCharacter(built.app, tok, "RagSafe");

    await built.app.inject({
      method: "POST",
      url: "/v1/chat",
      headers: authHeader(tok),
      payload: {
        characterId,
        content: "我不想活了",
        mode: "simple",
      },
    });

    const chunks = await built.db
      .select({ content: memoryChunks.content })
      .from(memoryChunks)
      .where(eq(memoryChunks.characterId, characterId));
    expect(chunks.some((c) => c.content.includes("不想活"))).toBe(false);
  });

  it("returns locale-aware crisis safety response", async () => {
    const { token: tok } = await bootstrapTestUser(built.app);
    await built.app.inject({
      method: "PATCH",
      url: "/v1/users/me/locale",
      headers: authHeader(tok),
      payload: { locale: "ja-JP" },
    });
    const characterId = await createTestCharacter(built.app, tok, "Test");

    const chat = await built.app.inject({
      method: "POST",
      url: "/v1/chat",
      headers: authHeader(tok),
      payload: {
        characterId,
        content: "死にたい",
        mode: "simple",
      },
    });
    expect(chat.statusCode).toBe(200);
    const body = chat.json() as {
      safety: { flagged: boolean };
      reply: { content: string };
    };
    expect(body.safety.flagged).toBe(true);
    expect(body.reply.content).toContain("いのちの電話");
  });

  it("returns locale-aware crisis safety response for ko", async () => {
    const { token: tok } = await bootstrapTestUser(built.app);
    await built.app.inject({
      method: "PATCH",
      url: "/v1/users/me/locale",
      headers: authHeader(tok),
      payload: { locale: "ko-KR" },
    });
    const characterId = await createTestCharacter(built.app, tok, "Test");

    const chat = await built.app.inject({
      method: "POST",
      url: "/v1/chat",
      headers: authHeader(tok),
      payload: {
        characterId,
        content: "죽고 싶어",
        mode: "simple",
      },
    });
    expect(chat.statusCode).toBe(200);
    const body = chat.json() as {
      safety: { flagged: boolean };
      reply: { content: string };
    };
    expect(body.safety.flagged).toBe(true);
    expect(body.reply.content).toContain("1393");
  });

  it("lists supported locales", async () => {
    const res = await built.app.inject({
      method: "GET",
      url: "/v1/meta/locales",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { locales: { id: string }[] };
    expect(body.locales.some((l) => l.id === "zh-TW")).toBe(true);
    expect(body.locales.some((l) => l.id === "ja-JP")).toBe(true);
  });

  it("daily check-in grants coins once per day", async () => {
    const first = await built.app.inject({
      method: "POST",
      url: "/v1/rewards/daily-checkin",
      headers: authHeader(token),
    });
    expect(first.statusCode).toBe(200);
    const body = first.json() as { coinsAwarded: number };
    expect(body.coinsAwarded).toBeGreaterThan(0);

    const second = await built.app.inject({
      method: "POST",
      url: "/v1/rewards/daily-checkin",
      headers: authHeader(token),
    });
    expect(second.statusCode).toBe(409);
  });

  it("downgrades expired subscription on sync", async () => {
    const { userId: isoId, token: iso } = await bootstrapTestUser(built.app);
    await built.db
      .update(users)
      .set({
        subscriptionTier: "basic",
        subscriptionExpiresAt: "2020-01-01T00:00:00.000Z",
      })
      .where(eq(users.id, isoId));

    const res = await built.app.inject({
      method: "GET",
      url: "/v1/users/me",
      headers: authHeader(iso),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { subscriptionTier: string };
    expect(body.subscriptionTier).toBe("free");
  });

  it("PATCH subscription expiresAt downgrades on sync", async () => {
    const { token: iso } = await bootstrapTestUser(built.app);
    const patch = await built.app.inject({
      method: "PATCH",
      url: "/v1/users/me/subscription",
      headers: authHeader(iso),
      payload: {
        tier: "lite",
        expiresAt: "2020-01-01T00:00:00.000Z",
      },
    });
    expect(patch.statusCode).toBe(200);

    const res = await built.app.inject({
      method: "GET",
      url: "/v1/users/me",
      headers: authHeader(iso),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { subscriptionTier: string };
    expect(body.subscriptionTier).toBe("free");
  });

  it("PATCH subscription stamina supports lite zero-stamina chat", async () => {
    const { token: iso } = await bootstrapTestUser(built.app);
    await built.app.inject({
      method: "PATCH",
      url: "/v1/users/me/subscription",
      headers: authHeader(iso),
      payload: { tier: "lite", stamina: 0 },
    });
    const characterId = await createTestCharacter(built.app, iso, "PatchLiteStamina");
    const chat = await built.app.inject({
      method: "POST",
      url: "/v1/chat",
      headers: authHeader(iso),
      payload: { characterId, content: "hi", mode: "simple" },
    });
    expect(chat.statusCode).toBe(200);
    const me = await built.app.inject({
      method: "GET",
      url: "/v1/users/me",
      headers: authHeader(iso),
    });
    const body = me.json() as { subscriptionTier: string; stamina: number };
    expect(body.subscriptionTier).toBe("lite");
    expect(body.stamina).toBe(0);
  });

  it("rejects voice chat without basic subscription", async () => {
    const { token: tok } = await bootstrapTestUser(built.app);
    const characterId = await createTestCharacter(built.app, tok, "VoiceTest");

    const res = await built.app.inject({
      method: "POST",
      url: "/v1/chat",
      headers: authHeader(tok),
      payload: {
        characterId,
        content: "你好",
        mode: "simple",
        messageType: "voice",
      },
    });
    expect(res.statusCode).toBe(403);
    const body = res.json() as { error: string };
    expect(body.error).toBe("voice_requires_basic_subscription");
  });

  it("rejects fourth character for free tier", async () => {
    const { token: tok } = await bootstrapTestUser(built.app);
    for (let i = 0; i < 3; i++) {
      await createTestCharacter(built.app, tok, `Slot${i}`);
    }
    const blocked = await built.app.inject({
      method: "POST",
      url: "/v1/characters",
      headers: authHeader(tok),
      payload: {
        name: "OverLimit",
        personality: "calm",
        backstory: "test",
        speakingStyle: "warm",
      },
    });
    expect(blocked.statusCode).toBe(403);
    expect((blocked.json() as { error: string; limit: number }).error).toBe(
      "character_limit_reached",
    );
    expect((blocked.json() as { limit: number }).limit).toBe(3);
  });

  it("requires age confirmation before chat when gate enabled", async () => {
    const prev = process.env.AGE_GATE;
    process.env.AGE_GATE = "1";
    try {
      const chars = await built.app.inject({
        method: "GET",
        url: `/v1/users/${userId}/characters`,
        headers: authHeader(token),
      });
      const characterId = (
        chars.json() as { characters: { id: string }[] }
      ).characters[0]!.id;

      const chat = await built.app.inject({
        method: "POST",
        url: "/v1/chat",
        headers: authHeader(token),
        payload: { characterId, content: "hello" },
      });
      expect(chat.statusCode).toBe(403);
      expect((chat.json() as { error: string }).error).toBe(
        "age_confirmation_required",
      );

      const year = new Date().getFullYear() - 20;
      const confirm = await built.app.inject({
        method: "POST",
        url: "/v1/users/me/age-confirm",
        headers: authHeader(token),
        payload: { birthYear: year },
      });
      expect(confirm.statusCode).toBe(200);
    } finally {
      if (prev === undefined) delete process.env.AGE_GATE;
      else process.env.AGE_GATE = prev;
    }
  });

  it("offerwall grants coins", async () => {
    const res = await built.app.inject({
      method: "POST",
      url: "/v1/rewards/offerwall",
      headers: authHeader(token),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { coinsAwarded: number };
    expect(body.coinsAwarded).toBeGreaterThanOrEqual(1);
  });

  it("grants monthly subscription coins on first sync", async () => {
    const { userId: isoId, token: iso } = await bootstrapTestUser(built.app);
    const iap = await built.app.inject({
      method: "POST",
      url: "/v1/iap/verify",
      headers: authHeader(iso),
      payload: {
        platform: "ios",
        productId: "com.ctrlz.huhu.sub.lite",
        receipt: `dev_stub:lite-${isoId}`,
      },
    });
    expect(iap.statusCode).toBe(200);

    const me = await built.app.inject({
      method: "GET",
      url: "/v1/users/me",
      headers: authHeader(iso),
    });
    const body = me.json() as { coins: number; subscriptionTier: string };
    expect(body.subscriptionTier).toBe("lite");
    expect(body.coins).toBeGreaterThanOrEqual(50);
  });

  it("verifies IAP subscription stub (idempotent replay)", async () => {
    const { userId: isoId, token: iso } = await bootstrapTestUser(built.app);
    const receipt = `dev_stub:lite-${isoId}`;
    await built.app.inject({
      method: "POST",
      url: "/v1/iap/verify",
      headers: authHeader(iso),
      payload: {
        platform: "ios",
        productId: "com.ctrlz.huhu.sub.lite",
        receipt,
      },
    });
    const res = await built.app.inject({
      method: "POST",
      url: "/v1/iap/verify",
      headers: authHeader(iso),
      payload: {
        platform: "ios",
        productId: "com.ctrlz.huhu.sub.lite",
        receipt,
      },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      duplicate?: boolean;
      grant: { kind: string; tier?: string };
      economy: { subscriptionTier: string };
    };
    expect(body.duplicate).toBe(true);
    expect(body.grant.kind).toBe("subscription");
    expect(body.economy.subscriptionTier).toBe("lite");
  });

  it("allows lite subscriber to chat with zero stamina", async () => {
    const { userId: isoId, token: iso } = await bootstrapTestUser(built.app);
    const characterId = await createTestCharacter(built.app, iso, "LiteStamina");
    await built.app.inject({
      method: "POST",
      url: "/v1/iap/verify",
      headers: authHeader(iso),
      payload: {
        platform: "ios",
        productId: "com.ctrlz.huhu.sub.lite",
        receipt: `dev_stub:lite-stamina-${isoId}`,
      },
    });
    const now = new Date().toISOString();
    await built.db
      .update(users)
      .set({ stamina: 0, staminaUpdatedAt: now })
      .where(eq(users.id, isoId));
    const chat = await built.app.inject({
      method: "POST",
      url: "/v1/chat",
      headers: authHeader(iso),
      payload: { characterId, content: "hi lite", mode: "simple" },
    });
    expect(chat.statusCode).toBe(200);
    const me = await built.app.inject({
      method: "GET",
      url: "/v1/users/me",
      headers: authHeader(iso),
    });
    const body = me.json() as { stamina: number; subscriptionTier: string };
    expect(body.subscriptionTier).toBe("lite");
    expect(body.stamina).toBe(0);
  });

  it("lite subscriber still needs coins for long mode", async () => {
    const { userId: isoId, token: iso } = await bootstrapTestUser(built.app);
    const characterId = await createTestCharacter(built.app, iso, "LiteLong");
    await built.app.inject({
      method: "POST",
      url: "/v1/iap/verify",
      headers: authHeader(iso),
      payload: {
        platform: "ios",
        productId: "com.ctrlz.huhu.sub.lite",
        receipt: `dev_stub:lite-long-${isoId}`,
      },
    });
    await built.db
      .update(users)
      .set({ coins: 0 })
      .where(eq(users.id, isoId));
    const chat = await built.app.inject({
      method: "POST",
      url: "/v1/chat",
      headers: authHeader(iso),
      payload: { characterId, content: "deep talk", mode: "long" },
    });
    expect(chat.statusCode).toBe(402);
    expect((chat.json() as { error: string }).error).toBe("insufficient_coins");
  });

  it("lite subscriber can use long mode when coins are available", async () => {
    const { userId: isoId, token: iso } = await bootstrapTestUser(built.app);
    const characterId = await createTestCharacter(built.app, iso, "LiteLongOk");
    await built.app.inject({
      method: "POST",
      url: "/v1/iap/verify",
      headers: authHeader(iso),
      payload: {
        platform: "ios",
        productId: "com.ctrlz.huhu.sub.lite",
        receipt: `dev_stub:lite-long-ok-${isoId}`,
      },
    });
    await built.db
      .update(users)
      .set({ coins: 10, stamina: 0 })
      .where(eq(users.id, isoId));
    const chat = await built.app.inject({
      method: "POST",
      url: "/v1/chat",
      headers: authHeader(iso),
      payload: { characterId, content: "deep talk ok", mode: "long" },
    });
    expect(chat.statusCode).toBe(200);
    const me = await built.app.inject({
      method: "GET",
      url: "/v1/users/me",
      headers: authHeader(iso),
    });
    const body = me.json() as { coins: number; stamina: number };
    expect(body.stamina).toBe(0);
    expect(body.coins).toBe(5);
  });

  it("rejects free user chat when stamina exhausted", async () => {
    const { userId: isoId, token: iso } = await bootstrapTestUser(built.app);
    const characterId = await createTestCharacter(built.app, iso, "NoStamina");
    const now = new Date().toISOString();
    await built.db
      .update(users)
      .set({ stamina: 0, staminaUpdatedAt: now })
      .where(eq(users.id, isoId));
    const chat = await built.app.inject({
      method: "POST",
      url: "/v1/chat",
      headers: authHeader(iso),
      payload: { characterId, content: "no stamina", mode: "simple" },
    });
    expect(chat.statusCode).toBe(402);
    expect((chat.json() as { error: string }).error).toBe(
      "insufficient_stamina",
    );
  });

  it("rejects chat when content is empty", async () => {
    const characterId = await firstOwnedCharacterId(built, userId);
    const chat = await built.app.inject({
      method: "POST",
      url: "/v1/chat",
      headers: authHeader(token),
      payload: { characterId, content: "   ", mode: "simple" },
    });
    expect(chat.statusCode).toBe(400);
    expect((chat.json() as { error: string }).error).toBe("content_required");
  });

  it("dev-economy patch sets stamina and coins in non-production", async () => {
    const { token: iso } = await bootstrapTestUser(built.app);
    const patch = await built.app.inject({
      method: "PATCH",
      url: "/v1/users/me/dev-economy",
      headers: authHeader(iso),
      payload: { stamina: 0, coins: 7 },
    });
    expect(patch.statusCode).toBe(200);
    const body = patch.json() as { stamina: number; coins: number };
    expect(body.stamina).toBe(0);
    expect(body.coins).toBe(7);
  });

  it("dev-economy rejects empty patch body", async () => {
    const { token: iso } = await bootstrapTestUser(built.app);
    const patch = await built.app.inject({
      method: "PATCH",
      url: "/v1/users/me/dev-economy",
      headers: authHeader(iso),
      payload: {},
    });
    expect(patch.statusCode).toBe(400);
    expect((patch.json() as { error: string }).error).toBe("validation_failed");
  });

  it("corrects mock LLM character break in chat", async () => {
    const prev = process.env.LLM_MOCK_BREAK_CHARACTER;
    process.env.LLM_MOCK_BREAK_CHARACTER = "1";
    try {
      const characterId = await firstOwnedCharacterId(built, userId);
      const chat = await built.app.inject({
        method: "POST",
        url: "/v1/chat",
        headers: authHeader(token),
        payload: { characterId, content: "guard test", mode: "simple" },
      });
      expect(chat.statusCode).toBe(200);
      const body = chat.json() as {
        reply: { content: string; characterCorrected?: boolean };
      };
      expect(body.reply.characterCorrected).toBe(true);
      expect(body.reply.content).not.toMatch(/人工智慧|language model/i);
      expect(body.reply.content.length).toBeGreaterThan(10);
    } finally {
      if (prev === undefined) delete process.env.LLM_MOCK_BREAK_CHARACTER;
      else process.env.LLM_MOCK_BREAK_CHARACTER = prev;
    }
  });

  it("persists character guard correction in message history", async () => {
    const prev = process.env.LLM_MOCK_BREAK_CHARACTER;
    process.env.LLM_MOCK_BREAK_CHARACTER = "1";
    try {
      const characterId = await firstOwnedCharacterId(built, userId);
      await built.app.inject({
        method: "POST",
        url: "/v1/chat",
        headers: authHeader(token),
        payload: { characterId, content: "guard history", mode: "simple" },
      });
      const history = await built.app.inject({
        method: "GET",
        url: `/v1/characters/${characterId}/messages`,
        headers: authHeader(token),
      });
      expect(history.statusCode).toBe(200);
      const rows = (history.json() as { messages: { characterCorrected?: boolean }[] })
        .messages;
      const corrected = rows.filter((m) => m.characterCorrected);
      expect(corrected.length).toBeGreaterThan(0);

      const exported = await built.app.inject({
        method: "GET",
        url: `/v1/characters/${characterId}/export?format=webnovel`,
        headers: authHeader(token),
      });
      expect(exported.statusCode).toBe(200);
      expect((exported.json() as { markdown: string }).markdown).toContain(
        "*(角色修正)*",
      );
    } finally {
      if (prev === undefined) delete process.env.LLM_MOCK_BREAK_CHARACTER;
      else process.env.LLM_MOCK_BREAK_CHARACTER = prev;
    }
  });

  it("does not index mock break trigger into RAG memory", async () => {
    const { token: tok } = await bootstrapTestUser(built.app);
    const characterId = await createTestCharacter(built.app, tok, "RagGuard");

    await built.app.inject({
      method: "POST",
      url: "/v1/chat",
      headers: authHeader(tok),
      payload: {
        characterId,
        content: "__mock_break_character__",
        mode: "simple",
      },
    });

    const chunks = await built.db
      .select({ content: memoryChunks.content })
      .from(memoryChunks)
      .where(eq(memoryChunks.characterId, characterId));
    expect(chunks.some((c) => c.content.includes("__mock_break_character__"))).toBe(
      false,
    );
  });

  it("rejects exciting mode when coins insufficient", async () => {
    const { userId: isoId, token: iso } = await bootstrapTestUser(built.app);
    const characterId = await createTestCharacter(built.app, iso, "NoExciting");
    await built.db
      .update(users)
      .set({ coins: 0, stamina: 50 })
      .where(eq(users.id, isoId));
    const chat = await built.app.inject({
      method: "POST",
      url: "/v1/chat",
      headers: authHeader(iso),
      payload: { characterId, content: "romantic scene", mode: "exciting" },
    });
    expect(chat.statusCode).toBe(402);
    expect((chat.json() as { error: string }).error).toBe("insufficient_coins");
  });

  it("allows exciting mode when coins are available", async () => {
    const { userId: isoId, token: iso } = await bootstrapTestUser(built.app);
    const characterId = await createTestCharacter(built.app, iso, "ExcitingOk");
    await built.db
      .update(users)
      .set({ coins: 15, stamina: 50 })
      .where(eq(users.id, isoId));
    const chat = await built.app.inject({
      method: "POST",
      url: "/v1/chat",
      headers: authHeader(iso),
      payload: { characterId, content: "romantic ok", mode: "exciting" },
    });
    expect(chat.statusCode).toBe(200);
    const me = await built.app.inject({
      method: "GET",
      url: "/v1/users/me",
      headers: authHeader(iso),
    });
    expect((me.json() as { coins: number }).coins).toBe(5);
  });

  it("allows basic subscriber voice chat with zero stamina", async () => {
    const { userId: isoId, token: iso } = await bootstrapTestUser(built.app);
    const characterId = await createTestCharacter(built.app, iso, "BasicVoice");
    await built.app.inject({
      method: "POST",
      url: "/v1/iap/verify",
      headers: authHeader(iso),
      payload: {
        platform: "ios",
        productId: "com.ctrlz.huhu.sub.basic",
        receipt: `dev_stub:basic-voice-${isoId}`,
      },
    });
    await built.db
      .update(users)
      .set({ stamina: 0 })
      .where(eq(users.id, isoId));
    const chat = await built.app.inject({
      method: "POST",
      url: "/v1/chat",
      headers: authHeader(iso),
      payload: {
        characterId,
        content: "voice ok",
        mode: "simple",
        messageType: "voice",
      },
    });
    expect(chat.statusCode).toBe(200);
    const me = await built.app.inject({
      method: "GET",
      url: "/v1/users/me",
      headers: authHeader(iso),
    });
    const body = me.json() as { stamina: number; subscriptionTier: string };
    expect(body.subscriptionTier).toBe("basic");
    expect(body.stamina).toBe(0);
  });

  it("rejects receipt already redeemed by another user", async () => {
    const { token: first } = await bootstrapTestUser(built.app);
    const { token: second } = await bootstrapTestUser(built.app);
    const receipt = "dev_stub:shared-coins-pack";
    const ok = await built.app.inject({
      method: "POST",
      url: "/v1/iap/verify",
      headers: authHeader(first),
      payload: {
        platform: "web",
        productId: "com.ctrlz.huhu.coins.small",
        receipt,
      },
    });
    expect(ok.statusCode).toBe(200);

    const blocked = await built.app.inject({
      method: "POST",
      url: "/v1/iap/verify",
      headers: authHeader(second),
      payload: {
        platform: "web",
        productId: "com.ctrlz.huhu.coins.small",
        receipt,
      },
    });
    expect(blocked.statusCode).toBe(409);
    expect((blocked.json() as { error: string }).error).toBe(
      "receipt_already_redeemed",
    );
  });

  it("returns duplicate flag for repeated IAP receipt", async () => {
    const receipt = `dev_stub:coins-small-${userId}`;
    const first = await built.app.inject({
      method: "POST",
      url: "/v1/iap/verify",
      headers: authHeader(token),
      payload: {
        platform: "web",
        productId: "com.ctrlz.huhu.coins.small",
        receipt,
      },
    });
    expect(first.statusCode).toBe(200);
    const second = await built.app.inject({
      method: "POST",
      url: "/v1/iap/verify",
      headers: authHeader(token),
      payload: {
        platform: "web",
        productId: "com.ctrlz.huhu.coins.small",
        receipt,
      },
    });
    expect(second.statusCode).toBe(200);
    expect((second.json() as { duplicate?: boolean }).duplicate).toBe(true);
  });

  it("returns iap and report metadata", async () => {
    const res = await built.app.inject({
      method: "GET",
      url: "/v1/meta/iap-products",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      subscriptions: { tier: string; productId: string }[];
      products: { productId: string; kind: string }[];
      momentReportReasons: string[];
    };
    expect(body.subscriptions.map((s) => s.tier).sort()).toEqual([
      "basic",
      "lite",
      "premium",
    ]);
    expect(body.subscriptions.map((s) => s.productId).sort()).toEqual([
      "com.ctrlz.huhu.sub.basic",
      "com.ctrlz.huhu.sub.lite",
      "com.ctrlz.huhu.sub.premium",
    ]);
    expect(body.products.filter((p) => p.kind === "coins")).toHaveLength(3);
    expect(body.momentReportReasons).toContain("spam");
  });

  it("returns legacy iOS subscription product ids when platform=ios", async () => {
    const res = await built.app.inject({
      method: "GET",
      url: "/v1/meta/iap-products?platform=ios",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      subscriptions: { tier: string; productId: string }[];
    };
    expect(body.subscriptions.map((s) => s.productId).sort()).toEqual([
      "com.ctrlz.huhu.basic",
      "com.ctrlz.huhu.lite",
      "com.ctrlz.huhu.premium",
    ]);
  });

  it("verifies IAP with legacy iOS subscription product id", async () => {
    const boot = await built.app.inject({
      method: "POST",
      url: "/v1/users/bootstrap",
    });
    const { token: legacyToken } = boot.json() as { token: string };
    const res = await built.app.inject({
      method: "POST",
      url: "/v1/iap/verify",
      headers: authHeader(legacyToken),
      payload: {
        platform: "ios",
        productId: "com.ctrlz.huhu.lite",
        receipt: "valid_com.ctrlz.huhu.lite",
      },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      grant: { kind: string; tier?: string };
      economy: { subscriptionTier: string };
    };
    expect(body.grant.kind).toBe("subscription");
    expect(body.economy.subscriptionTier).toBe("lite");
  });

  it("returns store catalog with PPP and SKUs", async () => {
    const res = await built.app.inject({
      method: "GET",
      url: "/v1/meta/store-catalog?market=vn",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      catalog: {
        pricingRegion: string;
        pricing: { currency: string };
        productIds: { subscriptions: string[] };
      };
    };
    expect(body.catalog.pricingRegion).toBe("VN");
    expect(body.catalog.pricing.currency).toBe("VND");
    expect(body.catalog.productIds.subscriptions.length).toBe(3);
  });

  it("resolves CN store catalog by zh-CN locale", async () => {
    const res = await built.app.inject({
      method: "GET",
      url: "/v1/meta/store-catalog?locale=zh-CN",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      catalog: { market: string; pricingRegion: string; pricing: { currency: string } };
    };
    expect(body.catalog.market).toBe("cn");
    expect(body.catalog.pricingRegion).toBe("CN");
    expect(body.catalog.pricing.currency).toBe("CNY");
  });

  it("resolves store catalog by locale", async () => {
    const res = await built.app.inject({
      method: "GET",
      url: "/v1/meta/store-catalog?locale=ko-KR",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      catalog: { market: string; pricingRegion: string };
    };
    expect(body.catalog.market).toBe("kr");
    expect(body.catalog.pricingRegion).toBe("KR");
  });

  it("returns KR store catalog with KRW PPP", async () => {
    const res = await built.app.inject({
      method: "GET",
      url: "/v1/meta/store-catalog?market=kr",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      catalog: { pricingRegion: string; pricing: { currency: string; lite: number } };
    };
    expect(body.catalog.pricingRegion).toBe("KR");
    expect(body.catalog.pricing.currency).toBe("KRW");
    expect(body.catalog.pricing.lite).toBe(12_900);
  });

  it("returns economy meta", async () => {
    const res = await built.app.inject({
      method: "GET",
      url: "/v1/meta/economy",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      economy: {
        stamina: { max: number };
        coins: { longMode: number; offerwallMin: number; offerwallMax: number };
      };
    };
    expect(body.economy.stamina.max).toBe(50);
    expect(body.economy.coins.longMode).toBe(5);
    expect(body.economy.coins.offerwallMin).toBe(1);
    expect(body.economy.coins.offerwallMax).toBe(3);
  });

  it("returns bundled client config meta", async () => {
    const res = await built.app.inject({
      method: "GET",
      url: "/v1/meta/client-config?locale=ja-JP",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      config: {
        economy: { stamina: { max: number } };
        offerwall: { mode: string };
        supportResources: { region: string; privacyReminder: string };
      };
    };
    expect(body.config.economy.stamina.max).toBe(50);
    expect(body.config.offerwall.mode).toMatch(/^(dev_direct|verified)$/);
    expect(body.config.supportResources.region).toBe("JP");
    expect(body.config.supportResources.privacyReminder.length).toBeGreaterThan(
      10,
    );
    const storeUrls = (
      body.config as { storeUrls?: { support: string; privacy: string } }
    ).storeUrls;
    expect(storeUrls?.support).toMatch(/\/support$/);
    expect(storeUrls?.privacy).toMatch(/\/privacy$/);
    const tiers = (
      body.config as {
        subscriptionTiers?: {
          tier: string;
          entitlementsLabel?: string;
          tierDisplayName?: string;
        }[];
      }
    ).subscriptionTiers;
    expect(tiers?.map((t) => t.tier)).toEqual(["lite", "basic", "premium"]);
    const basic = tiers?.find((t) => t.tier === "basic");
    expect(basic?.entitlementsLabel).toContain("音声");
    expect(basic?.tierDisplayName).toBe("ベーシック");
    expect(
      (body.config as { subscriptionTiersPrompt?: string })
        .subscriptionTiersPrompt,
    ).toContain("ベーシック");
    const apiErrors = (body.config as { apiErrors?: Record<string, string> })
      .apiErrors;
    expect(apiErrors?.voice_requires_basic_subscription).toContain("ベーシック");
    expect(apiErrors?.insufficient_stamina).toBeTruthy();
    expect(Object.keys(apiErrors ?? {}).sort()).toEqual(
      [...API_ERROR_CODES].sort(),
    );
  });

  it("returns localized subscriptionTierDisplayName on GET /v1/users/me", async () => {
    const res = await built.app.inject({
      method: "GET",
      url: "/v1/users/me",
      headers: authHeader(token),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      subscriptionTier: string;
      subscriptionTierDisplayName: string;
    };
    expect(body.subscriptionTier).toBe("free");
    expect(body.subscriptionTierDisplayName).toBe("免費");
  });

  it("returns offerwall client meta", async () => {
    const res = await built.app.inject({
      method: "GET",
      url: "/v1/meta/offerwall",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      offerwall: {
        mode: string;
        dailyCap: number;
        sdkIntegration: string;
        endpoints: { claim: string };
      };
    };
    expect(body.offerwall.mode).toMatch(/^(dev_direct|verified)$/);
    expect(body.offerwall.dailyCap).toBeGreaterThan(0);
    expect(body.offerwall.sdkIntegration).toBe("hmac_only");
    expect(body.offerwall.endpoints.claim).toBe("/v1/rewards/offerwall");
  });

  it("returns locale-aware support resources", async () => {
    const res = await built.app.inject({
      method: "GET",
      url: "/v1/meta/support-resources?locale=ja-JP",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      resources: { region: string; privacyReminder: string };
    };
    expect(body.resources.region).toBe("JP");
    expect(body.resources.privacyReminder.length).toBeGreaterThan(10);
  });

  it("serves static support and privacy pages", async () => {
    for (const path of [
      "/support",
      "/privacy",
      "/support.html",
      "/privacy.html",
    ] as const) {
      const res = await built.app.inject({ method: "GET", url: path });
      expect(res.statusCode).toBe(200);
      expect(res.headers["content-type"]).toMatch(/text\/html/);
      expect(res.payload).toContain("com.ctrlz.huhu");
    }
  });

  it("includes coin pack PPP in store catalog", async () => {
    const res = await built.app.inject({
      method: "GET",
      url: "/v1/meta/store-catalog?market=tw",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      catalog: { coinPacks: { pack: string; price: number; currency: string }[] };
    };
    expect(body.catalog.coinPacks).toHaveLength(3);
    expect(body.catalog.coinPacks[0].currency).toBe("TWD");
  });

  it("returns IAP readiness for ops", async () => {
    const res = await built.app.inject({
      method: "GET",
      url: "/v1/meta/iap-readiness",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      readiness: {
        ios: { configured: boolean };
        android: { configured: boolean; packageName: boolean; playApi: boolean };
      };
    };
    expect(typeof body.readiness.ios.configured).toBe("boolean");
    expect(typeof body.readiness.android.configured).toBe("boolean");
    expect(typeof body.readiness.android.packageName).toBe("boolean");
    expect(typeof body.readiness.android.playApi).toBe("boolean");
  });

  it("returns store listing ASO copy by market", async () => {
    const markets = await built.app.inject({
      method: "GET",
      url: "/v1/meta/store-listings",
    });
    expect(markets.statusCode).toBe(200);
    const list = markets.json() as { markets: { market: string }[] };
    expect(list.markets.some((m) => m.market === "tw")).toBe(true);

    const tw = await built.app.inject({
      method: "GET",
      url: "/v1/meta/store-listing?market=tw",
    });
    expect(tw.statusCode).toBe(200);
    const body = tw.json() as {
      listing: { bundleId: string; appStore: { name: string } };
    };
    expect(body.listing.bundleId).toBe("com.ctrlz.huhu");
    expect(body.listing.appStore.name).toContain("呼呼");

    const bad = await built.app.inject({
      method: "GET",
      url: "/v1/meta/store-listing?market=xx",
    });
    expect(bad.statusCode).toBe(404);
  });

  it("reports sqlite driver on health", async () => {
    const res = await built.app.inject({ method: "GET", url: "/health" });
    const body = res.json() as {
      database?: string;
      economy?: { stamina: { max: number } };
      publicMeta?: { clientConfig?: string };
    };
    expect(body.database).toBe("sqlite");
    expect(body.economy?.stamina.max).toBe(50);
    expect(body.publicMeta?.clientConfig).toBe("/v1/meta/client-config");
    const security = (body as { security?: { jwtSecretConfigured?: boolean } })
      .security;
    expect(typeof security?.jwtSecretConfigured).toBe("boolean");
  });

  it("exports conversation as web novel markdown", async () => {
    const chars = await built.app.inject({
      method: "GET",
      url: `/v1/users/${userId}/characters`,
      headers: authHeader(token),
    });
    const { characters } = chars.json() as {
      characters: { id: string }[];
    };
    const characterId = characters[0]!.id;

    const res = await built.app.inject({
      method: "GET",
      url: `/v1/characters/${characterId}/export?format=webnovel`,
      headers: authHeader(token),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { markdown: string };
    expect(body.markdown).toContain("#");
  });

  it("scrubs PII from user lines in web novel export", async () => {
    const chars = await built.app.inject({
      method: "GET",
      url: `/v1/users/${userId}/characters`,
      headers: authHeader(token),
    });
    const characterId = (
      (chars.json() as { characters: { id: string }[] }).characters[0]!
    ).id;

    await built.app.inject({
      method: "POST",
      url: "/v1/chat",
      headers: authHeader(token),
      payload: {
        characterId,
        content: "聯絡 secret@test.com",
        mode: "simple",
      },
    });

    const res = await built.app.inject({
      method: "GET",
      url: `/v1/characters/${characterId}/export?format=webnovel`,
      headers: authHeader(token),
    });
    expect(res.statusCode).toBe(200);
    const md = (res.json() as { markdown: string }).markdown;
    expect(md).toContain("[EMAIL]");
    expect(md).not.toContain("secret@test.com");
  });

  it("lists character presets", async () => {
    const res = await built.app.inject({
      method: "GET",
      url: "/v1/characters/presets",
      headers: authHeader(token),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { presets: { id: string }[] };
    expect(body.presets.length).toBeGreaterThan(0);
  });

  it("returns default character meta by locale", async () => {
    const res = await built.app.inject({
      method: "GET",
      url: "/v1/meta/default-character?locale=ja-JP",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { presetId: string; greeting: string };
    expect(body.presetId).toBe("sakura");
    expect(body.greeting).toContain("さくら");
  });

  it("returns Alex preset for en locale", async () => {
    const res = await built.app.inject({
      method: "GET",
      url: "/v1/meta/default-character?locale=en",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { presetId: string };
    expect(body.presetId).toBe("alex");
  });

  it("creates and lists diary entries", async () => {
    const characterId = await firstOwnedCharacterId(built, userId);
    const create = await built.app.inject({
      method: "POST",
      url: `/v1/characters/${characterId}/diary`,
      headers: authHeader(token),
      payload: { title: "Rainy day", body: "We talked about music." },
    });
    expect(create.statusCode).toBe(201);
    const list = await built.app.inject({
      method: "GET",
      url: `/v1/characters/${characterId}/diary`,
      headers: authHeader(token),
    });
    expect(list.statusCode).toBe(200);
    const entries = (list.json() as { entries: { body: string }[] }).entries;
    expect(entries.length).toBeGreaterThan(0);
    expect(entries[0]!.body).toContain("music");
    const entryId = (create.json() as { entry: { id: string } }).entry.id;

    const patch = await built.app.inject({
      method: "PATCH",
      url: `/v1/characters/${characterId}/diary/${entryId}`,
      headers: authHeader(token),
      payload: { body: "We talked about jazz." },
    });
    expect(patch.statusCode).toBe(200);

    const del = await built.app.inject({
      method: "DELETE",
      url: `/v1/characters/${characterId}/diary/${entryId}`,
      headers: authHeader(token),
    });
    expect(del.statusCode).toBe(204);
    const listAfter = await built.app.inject({
      method: "GET",
      url: `/v1/characters/${characterId}/diary`,
      headers: authHeader(token),
    });
    expect((listAfter.json() as { entries: unknown[] }).entries).toHaveLength(0);
  });

  it("scrubs PII when indexing diary into RAG memory", async () => {
    const characterId = await firstOwnedCharacterId(built, userId);
    const create = await built.app.inject({
      method: "POST",
      url: `/v1/characters/${characterId}/diary`,
      headers: authHeader(token),
      payload: {
        title: "聯絡",
        body: "請寄信到 secret.diary@example.com 討論週末見面",
      },
    });
    expect(create.statusCode).toBe(201);
    const entryId = (create.json() as { entry: { id: string } }).entry.id;

    const chunks = await built.db
      .select({ content: memoryChunks.content })
      .from(memoryChunks)
      .where(eq(memoryChunks.characterId, characterId));
    const diaryChunk = chunks.find((c) => c.content.includes("日記"));
    expect(diaryChunk).toBeTruthy();
    expect(diaryChunk!.content).toContain("[EMAIL]");
    expect(diaryChunk!.content).not.toContain("secret.diary@example.com");

    await built.app.inject({
      method: "DELETE",
      url: `/v1/characters/${characterId}/diary/${entryId}`,
      headers: authHeader(token),
    });
  });

  it("creates and lists character moments", async () => {
    const characterId = await firstOwnedCharacterId(built, userId);
    const png =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
    const create = await built.app.inject({
      method: "POST",
      url: `/v1/characters/${characterId}/moments`,
      headers: authHeader(token),
      payload: {
        body: "Had a great walk today.",
        imageBase64: png,
        imageMimeType: "image/png",
      },
    });
    expect(create.statusCode).toBe(201);
    const created = create.json() as {
      moment: { id: string; media: { mimeType: string } | null };
    };
    const momentId = created.moment.id;
    expect(created.moment.media?.mimeType).toBe("image/png");

    const list = await built.app.inject({
      method: "GET",
      url: `/v1/characters/${characterId}/moments`,
      headers: authHeader(token),
    });
    expect(list.statusCode).toBe(200);
    const moments = (list.json() as { moments: { body: string }[] }).moments;
    expect(moments.length).toBeGreaterThan(0);
    expect(moments[0]!.body).toContain("walk");

    const feed = await built.app.inject({
      method: "GET",
      url: "/v1/feed/moments",
      headers: authHeader(token),
    });
    expect(feed.statusCode).toBe(200);
    const feedItems = (feed.json() as {
      moments: { id: string; characterName?: string }[];
    }).moments;
    expect(feedItems.some((m) => m.id === momentId)).toBe(true);
    expect(feedItems[0]?.characterName).toBeTruthy();

    const del = await built.app.inject({
      method: "DELETE",
      url: `/v1/characters/${characterId}/moments/${momentId}`,
      headers: authHeader(token),
    });
    expect(del.statusCode).toBe(204);
  });

  it("returns empty feed when user has no moments", async () => {
    const { token: iso } = await bootstrapTestUser(built.app);
    const feed = await built.app.inject({
      method: "GET",
      url: "/v1/feed/moments",
      headers: authHeader(iso),
    });
    expect(feed.statusCode).toBe(200);
    expect((feed.json() as { moments: unknown[] }).moments).toHaveLength(0);
  });

  it("public feed lists only public moments across users", async () => {
    const { token: poster } = await bootstrapTestUser(built.app);
    const posterCharId = await createTestCharacter(built.app, poster, "Poster");

    const privatePost = await built.app.inject({
      method: "POST",
      url: `/v1/characters/${posterCharId}/moments`,
      headers: authHeader(poster),
      payload: { body: "private note", visibility: "private" },
    });
    expect(privatePost.statusCode).toBe(201);

    const publicPost = await built.app.inject({
      method: "POST",
      url: `/v1/characters/${posterCharId}/moments`,
      headers: authHeader(poster),
      payload: { body: "hello community", visibility: "public" },
    });
    expect(publicPost.statusCode).toBe(201);
    const publicId = (
      publicPost.json() as { moment: { id: string; visibility: string } }
    ).moment.id;
    expect(
      (publicPost.json() as { moment: { visibility: string } }).moment
        .visibility,
    ).toBe("public");

    const { token: viewer } = await bootstrapTestUser(built.app);
    const publicFeed = await built.app.inject({
      method: "GET",
      url: "/v1/feed/moments/public",
      headers: authHeader(viewer),
    });
    expect(publicFeed.statusCode).toBe(200);
    const items = (
      publicFeed.json() as {
        moments: { id: string; body: string; visibility: string }[];
      }
    ).moments;
    expect(items.some((m) => m.id === publicId)).toBe(true);
    expect(items.every((m) => m.visibility === "public")).toBe(true);
    expect(items.some((m) => m.body === "private note")).toBe(false);

    const patch = await built.app.inject({
      method: "PATCH",
      url: `/v1/characters/${posterCharId}/moments/${publicId}`,
      headers: authHeader(poster),
      payload: { visibility: "private" },
    });
    expect(patch.statusCode).toBe(200);
    expect(
      (patch.json() as { moment: { visibility: string } }).moment.visibility,
    ).toBe("private");

    const afterHide = await built.app.inject({
      method: "GET",
      url: "/v1/feed/moments/public",
      headers: authHeader(viewer),
    });
    const afterItems = (afterHide.json() as { moments: { id: string }[] })
      .moments;
    expect(afterItems.some((m) => m.id === publicId)).toBe(false);
  });

  it("hides public moment after enough unique reports", async () => {
    const { token: poster } = await bootstrapTestUser(built.app);
    const posterCharId = await createTestCharacter(built.app, poster, "ModTest");

    const publicPost = await built.app.inject({
      method: "POST",
      url: `/v1/characters/${posterCharId}/moments`,
      headers: authHeader(poster),
      payload: { body: "report me", visibility: "public" },
    });
    const momentId = (
      publicPost.json() as { moment: { id: string } }
    ).moment.id;

    for (let i = 0; i < 3; i++) {
      const { token: reporter } = await bootstrapTestUser(built.app);
      const report = await built.app.inject({
        method: "POST",
        url: `/v1/feed/moments/${momentId}/report`,
        headers: authHeader(reporter),
        payload: { reason: "spam" },
      });
      expect(report.statusCode).toBe(201);
    }

    const feed = await built.app.inject({
      method: "GET",
      url: "/v1/feed/moments/public",
      headers: authHeader(poster),
    });
    const items = (feed.json() as { moments: { id: string }[] }).moments;
    expect(items.some((m) => m.id === momentId)).toBe(false);

    const dup = await built.app.inject({
      method: "POST",
      url: `/v1/feed/moments/${momentId}/report`,
      headers: authHeader(poster),
      payload: { reason: "spam" },
    });
    expect(dup.statusCode).toBe(400);
  });

  it("admin lists hidden moments and restores", async () => {
    const adminKey = "integration-admin-key";
    const prev = process.env.ADMIN_API_KEY;
    process.env.ADMIN_API_KEY = adminKey;
    try {
      const { token: poster } = await bootstrapTestUser(built.app);
      const posterCharId = await createTestCharacter(
        built.app,
        poster,
        "AdminMod",
      );
      const publicPost = await built.app.inject({
        method: "POST",
        url: `/v1/characters/${posterCharId}/moments`,
        headers: authHeader(poster),
        payload: { body: "admin hide test", visibility: "public" },
      });
      const momentId = (
        publicPost.json() as { moment: { id: string } }
      ).moment.id;

      for (let i = 0; i < 3; i++) {
        const { token: reporter } = await bootstrapTestUser(built.app);
        const report = await built.app.inject({
          method: "POST",
          url: `/v1/feed/moments/${momentId}/report`,
          headers: authHeader(reporter),
          payload: { reason: "harassment" },
        });
        expect(report.statusCode).toBe(201);
      }

      const noKey = await built.app.inject({
        method: "GET",
        url: "/v1/admin/moments/hidden",
      });
      expect(noKey.statusCode).toBe(401);

      const hidden = await built.app.inject({
        method: "GET",
        url: "/v1/admin/moments/hidden",
        headers: { "x-admin-key": adminKey },
      });
      expect(hidden.statusCode).toBe(200);
      const list = (
        hidden.json() as { moments: { id: string; reportCount: number }[] }
      ).moments;
      const row = list.find((m) => m.id === momentId);
      expect(row).toBeDefined();
      expect(row!.reportCount).toBeGreaterThanOrEqual(3);

      const restore = await built.app.inject({
        method: "POST",
        url: `/v1/admin/moments/${momentId}/restore`,
        headers: { "x-admin-key": adminKey },
      });
      expect(restore.statusCode).toBe(200);

      const { token: viewer } = await bootstrapTestUser(built.app);
      const feed = await built.app.inject({
        method: "GET",
        url: "/v1/feed/moments/public",
        headers: authHeader(viewer),
      });
      const items = (feed.json() as { moments: { id: string }[] }).moments;
      expect(items.some((m) => m.id === momentId)).toBe(true);

      const afterRestore = await built.app.inject({
        method: "GET",
        url: "/v1/admin/moments/hidden",
        headers: { "x-admin-key": adminKey },
      });
      const afterList = (afterRestore.json() as { moments: { id: string }[] })
        .moments;
      expect(afterList.some((m) => m.id === momentId)).toBe(false);

      const { token: reporter } = await bootstrapTestUser(built.app);
      const oneReport = await built.app.inject({
        method: "POST",
        url: `/v1/feed/moments/${momentId}/report`,
        headers: authHeader(reporter),
        payload: { reason: "spam" },
      });
      expect(oneReport.statusCode).toBe(201);
      const stillVisible = await built.app.inject({
        method: "GET",
        url: "/v1/feed/moments/public",
        headers: authHeader(viewer),
      });
      expect(
        (stillVisible.json() as { moments: { id: string }[] }).moments.some(
          (m) => m.id === momentId,
        ),
      ).toBe(true);
    } finally {
      if (prev === undefined) delete process.env.ADMIN_API_KEY;
      else process.env.ADMIN_API_KEY = prev;
    }
  });

  it("shows friends-only moments to accepted friends", async () => {
    const { token: userA, userId: userAId } = await bootstrapTestUser(
      built.app,
    );
    const { token: userB, userId: userBId } = await bootstrapTestUser(
      built.app,
    );
    const { token: stranger } = await bootstrapTestUser(built.app);

    const req = await built.app.inject({
      method: "POST",
      url: "/v1/friends/request",
      headers: authHeader(userA),
      payload: { targetUserId: userBId },
    });
    expect(req.statusCode).toBe(201);
    const friendshipId = (
      req.json() as { friendship: { id: string } }
    ).friendship.id;

    const accept = await built.app.inject({
      method: "POST",
      url: `/v1/friends/${friendshipId}/accept`,
      headers: authHeader(userB),
    });
    expect(accept.statusCode).toBe(200);

    const charA = await createTestCharacter(built.app, userA, "FriendA");
    const post = await built.app.inject({
      method: "POST",
      url: `/v1/characters/${charA}/moments`,
      headers: authHeader(userA),
      payload: { body: "friends secret", visibility: "friends" },
    });
    expect(post.statusCode).toBe(201);
    const momentId = (post.json() as { moment: { id: string } }).moment.id;

    const friendFeed = await built.app.inject({
      method: "GET",
      url: "/v1/feed/moments/friends",
      headers: authHeader(userB),
    });
    expect(friendFeed.statusCode).toBe(200);
    const friendItems = (friendFeed.json() as { moments: { id: string }[] })
      .moments;
    expect(friendItems.some((m) => m.id === momentId)).toBe(true);

    const publicFeed = await built.app.inject({
      method: "GET",
      url: "/v1/feed/moments/public",
      headers: authHeader(stranger),
    });
    const publicItems = (publicFeed.json() as { moments: { id: string }[] })
      .moments;
    expect(publicItems.some((m) => m.id === momentId)).toBe(false);

    const strangerFriends = await built.app.inject({
      method: "GET",
      url: "/v1/feed/moments/friends",
      headers: authHeader(stranger),
    });
    expect(
      (strangerFriends.json() as { moments: { id: string }[] }).moments.some(
        (m) => m.id === momentId,
      ),
    ).toBe(false);

    expect(userAId).not.toBe(userBId);
  });

  it("adds friends by invite code", async () => {
    const { token: userA } = await bootstrapTestUser(built.app);
    const { token: userB } = await bootstrapTestUser(built.app);

    const meB = await built.app.inject({
      method: "GET",
      url: "/v1/users/me",
      headers: authHeader(userB),
    });
    const codeFromB = (meB.json() as { inviteCode: string }).inviteCode;
    expect(codeFromB).toMatch(/^[A-Z2-9]{8}$/);

    const req = await built.app.inject({
      method: "POST",
      url: "/v1/friends/request",
      headers: authHeader(userA),
      payload: { inviteCode: codeFromB },
    });
    expect(req.statusCode).toBe(201);

    const bad = await built.app.inject({
      method: "POST",
      url: "/v1/friends/request",
      headers: authHeader(userB),
      payload: { inviteCode: "ZZZZZZZZ" },
    });
    expect(bad.statusCode).toBe(404);
    expect((bad.json() as { error: string }).error).toBe(
      "invite_code_not_found",
    );
  });

  it("blocks friend requests and removes friendships", async () => {
    const { token: userA, userId: userAId } = await bootstrapTestUser(
      built.app,
    );
    const { token: userB, userId: userBId } = await bootstrapTestUser(
      built.app,
    );

    const req = await built.app.inject({
      method: "POST",
      url: "/v1/friends/request",
      headers: authHeader(userA),
      payload: { targetUserId: userBId },
    });
    expect(req.statusCode).toBe(201);
    const friendshipId = (
      req.json() as { friendship: { id: string } }
    ).friendship.id;

    const accept = await built.app.inject({
      method: "POST",
      url: `/v1/friends/${friendshipId}/accept`,
      headers: authHeader(userB),
    });
    expect(accept.statusCode).toBe(200);

    const block = await built.app.inject({
      method: "POST",
      url: "/v1/blocks",
      headers: authHeader(userA),
      payload: { userId: userBId },
    });
    expect(block.statusCode).toBe(201);

    const friendsAfter = await built.app.inject({
      method: "GET",
      url: "/v1/friends",
      headers: authHeader(userA),
    });
    expect(
      (friendsAfter.json() as { friends: { userId: string }[] }).friends,
    ).toHaveLength(0);

    const retry = await built.app.inject({
      method: "POST",
      url: "/v1/friends/request",
      headers: authHeader(userA),
      payload: { targetUserId: userBId },
    });
    expect(retry.statusCode).toBe(403);
    expect((retry.json() as { error: string }).error).toBe("blocked");

    expect(userAId).not.toBe(userBId);
  });

  it("searches users by display name and invite code", async () => {
    const { token: searcher } = await bootstrapTestUser(built.app);
    const { token: target, userId: targetId } = await bootstrapTestUser(
      built.app,
    );

    const rename = await built.app.inject({
      method: "PATCH",
      url: "/v1/users/me/display-name",
      headers: authHeader(target),
      payload: { displayName: "HuhuSearchBuddy" },
    });
    expect(rename.statusCode).toBe(200);

    const meTarget = await built.app.inject({
      method: "GET",
      url: "/v1/users/me",
      headers: authHeader(target),
    });
    const inviteCode = (meTarget.json() as { inviteCode: string }).inviteCode;

    const byName = await built.app.inject({
      method: "GET",
      url: "/v1/users/search?q=SearchBuddy",
      headers: authHeader(searcher),
    });
    expect(byName.statusCode).toBe(200);
    const nameHits = (byName.json() as { results: { userId: string }[] })
      .results;
    expect(nameHits.some((h) => h.userId === targetId)).toBe(true);

    const byCode = await built.app.inject({
      method: "GET",
      url: `/v1/users/search?q=${inviteCode}`,
      headers: authHeader(searcher),
    });
    expect(byCode.statusCode).toBe(200);
    const codeHits = (byCode.json() as { results: { userId: string }[] })
      .results;
    expect(codeHits.some((h) => h.userId === targetId)).toBe(true);
  });

  it("returns invite QR data URL", async () => {
    const prev = process.env.PUBLIC_WEB_URL;
    process.env.PUBLIC_WEB_URL = "https://app.huhu.test";
    try {
      const { token } = await bootstrapTestUser(built.app);
      const qr = await built.app.inject({
        method: "GET",
        url: "/v1/users/me/invite-qr",
        headers: authHeader(token),
      });
      expect(qr.statusCode).toBe(200);
      const body = qr.json() as { dataUrl: string; payload: string };
      expect(body.dataUrl).toMatch(/^data:image\/png;base64,/);
      expect(body.payload).toContain("https://app.huhu.test/?invite=");
    } finally {
      if (prev === undefined) delete process.env.PUBLIC_WEB_URL;
      else process.env.PUBLIC_WEB_URL = prev;
    }
  });

  it("returns inviteLink on users/me when PUBLIC_WEB_URL is set", async () => {
    const prev = process.env.PUBLIC_WEB_URL;
    process.env.PUBLIC_WEB_URL = "https://app.huhu.test";
    try {
      const { token } = await bootstrapTestUser(built.app);
      const me = await built.app.inject({
        method: "GET",
        url: "/v1/users/me",
        headers: authHeader(token),
      });
      expect(me.statusCode).toBe(200);
      const body = me.json() as { inviteCode: string; inviteLink: string };
      expect(body.inviteLink).toContain("https://app.huhu.test/?invite=");
      expect(body.inviteLink).toContain(body.inviteCode);
    } finally {
      if (prev === undefined) delete process.env.PUBLIC_WEB_URL;
      else process.env.PUBLIC_WEB_URL = prev;
    }
  });

  it("accepts image chat with caption", async () => {
    const now = new Date().toISOString();
    await built.db
      .update(users)
      .set({ stamina: 50, staminaUpdatedAt: now })
      .where(eq(users.id, userId));

    const characterId = await firstOwnedCharacterId(built, userId);
    const png =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
    const chat = await built.app.inject({
      method: "POST",
      url: "/v1/chat",
      headers: authHeader(token),
      payload: {
        characterId,
        content: "today's sky",
        mode: "simple",
        messageType: "image",
        imageBase64: png,
        imageMimeType: "image/png",
      },
    });
    expect(chat.statusCode).toBe(200);
    const body = chat.json() as {
      reply: { content: string; userMedia?: { imageBase64: string } };
    };
    expect(body.reply.content.length).toBeGreaterThan(0);
    expect(body.reply.userMedia?.imageBase64).toBe(png);
  });

  it("normalizes en-US BCP-47 tag for default character", async () => {
    const res = await built.app.inject({
      method: "GET",
      url: "/v1/meta/default-character?locale=en-US",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { presetId: string; locale: string };
    expect(body.presetId).toBe("alex");
    expect(body.locale).toBe("en");
  });

  it("issues offerwall claim ticket when secret configured", async () => {
    const prev = process.env.OFFERWALL_SECRET;
    process.env.OFFERWALL_SECRET = "integration-test-secret";
    const res = await built.app.inject({
      method: "POST",
      url: "/v1/rewards/offerwall/prepare",
      headers: authHeader(token),
    });
    process.env.OFFERWALL_SECRET = prev;
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      verificationRequired: boolean;
      transactionId?: string;
    };
    expect(body.verificationRequired).toBe(true);
    expect(body.transactionId?.startsWith("ow_")).toBe(true);
  });

  it("lists user characters", async () => {
    const res = await built.app.inject({
      method: "GET",
      url: `/v1/users/${userId}/characters`,
      headers: authHeader(token),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { characters: unknown[] };
    expect(body.characters.length).toBeGreaterThan(0);
  });

  it("users/me includes plan with PPP pricing", async () => {
    const res = await built.app.inject({
      method: "GET",
      url: "/v1/users/me",
      headers: authHeader(token),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      plan: {
        pricing: { currency: string };
        entitlements: { maxCharacters: number };
      };
    };
    expect(body.plan.pricing.currency).toBeTruthy();
    expect(body.plan.entitlements.maxCharacters).toBeGreaterThan(0);
  });

  it("clears and deletes character messages", async () => {
    const chars = await built.app.inject({
      method: "GET",
      url: `/v1/users/${userId}/characters`,
      headers: authHeader(token),
    });
    const characterId = (chars.json() as { characters: { id: string }[] })
      .characters[0]!.id;

    const listed = await built.app.inject({
      method: "GET",
      url: `/v1/characters/${characterId}/messages?limit=10`,
      headers: authHeader(token),
    });
    const msgs = (listed.json() as { messages: { id: string }[] }).messages;
    expect(msgs.length).toBeGreaterThan(0);

    const delOne = await built.app.inject({
      method: "DELETE",
      url: `/v1/characters/${characterId}/messages/${msgs[0]!.id}`,
      headers: authHeader(token),
    });
    expect(delOne.statusCode).toBe(200);

    const lenientDelete = await built.app.inject({
      method: "DELETE",
      url: `/v1/characters/${characterId}/messages/${msgs[1]!.id}`,
      headers: {
        ...authHeader(token),
        "content-type": "application/json",
      },
    });
    expect(lenientDelete.statusCode).toBe(200);

    const clear = await built.app.inject({
      method: "DELETE",
      url: `/v1/characters/${characterId}/messages`,
      headers: authHeader(token),
    });
    expect(clear.statusCode).toBe(200);

    const after = await built.app.inject({
      method: "GET",
      url: `/v1/characters/${characterId}/messages`,
      headers: authHeader(token),
    });
    expect((after.json() as { messages: unknown[] }).messages).toHaveLength(0);
  });

  it("allows bodyless DELETE memories with stray JSON content-type", async () => {
    const chars = await built.app.inject({
      method: "GET",
      url: `/v1/users/${userId}/characters`,
      headers: authHeader(token),
    });
    const characterId = (chars.json() as { characters: { id: string }[] })
      .characters[0]!.id;

    const res = await built.app.inject({
      method: "DELETE",
      url: `/v1/characters/${characterId}/memories`,
      headers: {
        ...authHeader(token),
        "content-type": "application/json",
      },
    });
    expect(res.statusCode).toBe(200);
  });

  it("returns Vietnamese ui strings", async () => {
    const res = await built.app.inject({
      method: "GET",
      url: "/v1/meta/ui-strings?locale=vi-VN",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { locale: string; strings: { send: string } };
    expect(body.locale).toBe("vi-VN");
    expect(body.strings.send).toBe("Gửi");
  });
});

describe("rate limit (db backend)", () => {
  let rlBuilt: Awaited<ReturnType<typeof buildApp>>;
  let rlToken: string;
  let rlTmp: string;
  const saved = {
    backend: process.env.RATE_LIMIT_BACKEND,
    limit: process.env.FRIEND_REQUEST_RATE_LIMIT,
  };

  beforeAll(async () => {
    process.env.RATE_LIMIT_BACKEND = "db";
    process.env.FRIEND_REQUEST_RATE_LIMIT = "2";
    rlTmp = mkdtempSync(join(tmpdir(), "huhu-rl-int-"));
    rlBuilt = await buildApp({ dbPath: join(rlTmp, "rl.db") });
    await rlBuilt.app.ready();
    const boot = await bootstrapTestUser(rlBuilt.app);
    rlToken = boot.token;
  });

  afterAll(async () => {
    await rlBuilt.app.close();
    rlBuilt.closeDb();
    await rlBuilt.closeVectorStore?.();
    if (saved.backend === undefined) delete process.env.RATE_LIMIT_BACKEND;
    else process.env.RATE_LIMIT_BACKEND = saved.backend;
    if (saved.limit === undefined) delete process.env.FRIEND_REQUEST_RATE_LIMIT;
    else process.env.FRIEND_REQUEST_RATE_LIMIT = saved.limit;
    await new Promise((r) => setTimeout(r, 50));
    try {
      rmSync(rlTmp, { recursive: true, force: true });
    } catch {
      /* Windows sqlite lock */
    }
  });

  it("returns 429 when friend request hourly cap exceeded", async () => {
    const a = await bootstrapTestUser(rlBuilt.app);
    const b = await bootstrapTestUser(rlBuilt.app);
    for (const target of [a, b]) {
      const ok = await rlBuilt.app.inject({
        method: "POST",
        url: "/v1/friends/request",
        headers: authHeader(rlToken),
        payload: { targetUserId: target.userId },
      });
      expect([200, 201]).toContain(ok.statusCode);
    }
    const c = await bootstrapTestUser(rlBuilt.app);
    const limited = await rlBuilt.app.inject({
      method: "POST",
      url: "/v1/friends/request",
      headers: authHeader(rlToken),
      payload: { targetUserId: c.userId },
    });
    expect(limited.statusCode).toBe(429);
    expect((limited.json() as { error: string }).error).toBe("rate_limited");
  });
});
