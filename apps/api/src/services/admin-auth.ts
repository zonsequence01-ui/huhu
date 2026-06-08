import type { FastifyReply, FastifyRequest } from "fastify";

export function isAdminApiConfigured(): boolean {
  return Boolean(process.env.ADMIN_API_KEY?.trim());
}

export function requireAdmin(
  req: FastifyRequest,
  reply: FastifyReply,
): boolean {
  const expected = process.env.ADMIN_API_KEY?.trim();
  if (!expected) {
    reply.status(503).send({ error: "admin_not_configured" });
    return false;
  }
  const provided = req.headers["x-admin-key"];
  const key = Array.isArray(provided) ? provided[0] : provided;
  if (key !== expected) {
    reply.status(401).send({ error: "admin_unauthorized" });
    return false;
  }
  return true;
}
