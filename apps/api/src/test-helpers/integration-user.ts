import type { FastifyInstance } from "fastify";
import { expect } from "vitest";

export function authHeader(token: string): { authorization: string } {
  return { authorization: `Bearer ${token}` };
}

export async function bootstrapTestUser(
  app: FastifyInstance,
): Promise<{ userId: string; token: string }> {
  const boot = await app.inject({
    method: "POST",
    url: "/v1/users/bootstrap",
  });
  expect(boot.statusCode).toBe(200);
  return boot.json() as { userId: string; token: string };
}

export async function createTestCharacter(
  app: FastifyInstance,
  token: string,
  name = "TestChar",
): Promise<string> {
  const res = await app.inject({
    method: "POST",
    url: "/v1/characters",
    headers: authHeader(token),
    payload: {
      name,
      personality: "gentle",
      backstory: "test",
      speakingStyle: "casual",
    },
  });
  expect(res.statusCode).toBe(200);
  return (res.json() as { characterId: string }).characterId;
}
