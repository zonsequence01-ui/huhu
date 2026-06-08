import { SignJWT, jwtVerify } from "jose";
import type { FastifyReply, FastifyRequest } from "fastify";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "huhu-dev-secret-change-in-production",
);

export async function signAccessToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

export async function verifyAccessToken(
  token: string,
): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

function extractBearer(req: FastifyRequest): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice(7);
}

export async function requireAuth(
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const token = extractBearer(req);
  if (!token) {
    reply.status(401).send({ error: "unauthorized" });
    return;
  }
  const userId = await verifyAccessToken(token);
  if (!userId) {
    reply.status(401).send({ error: "invalid_token" });
    return;
  }
  req.userId = userId;
}

declare module "fastify" {
  interface FastifyRequest {
    userId?: string;
  }
}
