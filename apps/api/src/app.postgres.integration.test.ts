import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "./app.js";

const pgUrl = process.env.TEST_DATABASE_URL?.trim();

describe.skipIf(!pgUrl)("API postgres integration", () => {
  let built: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => {
    process.env.AGE_GATE = "0";
    built = await buildApp({ databaseUrl: pgUrl });
    await built.app.ready();
  });

  afterAll(async () => {
    await built.app.close();
  });

  it("health reports postgres driver", async () => {
    const res = await built.app.inject({ method: "GET", url: "/health" });
    const body = res.json() as { database?: string; status?: string };
    expect(body.status).toBe("ok");
    expect(body.database).toBe("postgres");
  });

  it("bootstraps user and chats on postgres", async () => {
    const boot = await built.app.inject({
      method: "POST",
      url: "/v1/users/bootstrap",
    });
    expect(boot.statusCode).toBe(200);
    const { token, userId } = boot.json() as { token: string; userId: string };

    const char = await built.app.inject({
      method: "POST",
      url: "/v1/characters",
      headers: { authorization: `Bearer ${token}` },
      payload: {
        name: "PgTest",
        personality: "test",
        backstory: "test",
        speakingStyle: "test",
      },
    });
    expect(char.statusCode).toBe(200);
    const { characterId } = char.json() as { characterId: string };

    const chat = await built.app.inject({
      method: "POST",
      url: "/v1/chat",
      headers: { authorization: `Bearer ${token}` },
      payload: {
        characterId,
        content: "hello postgres",
        mode: "simple",
      },
    });
    if (chat.statusCode !== 200) {
      throw new Error(`chat failed: ${chat.statusCode} ${chat.body}`);
    }

    const list = await built.app.inject({
      method: "GET",
      url: `/v1/users/${userId}/characters`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(list.statusCode).toBe(200);
  });
});
