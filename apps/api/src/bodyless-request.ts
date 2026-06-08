import type { FastifyInstance, FastifyRequest } from "fastify";

/** Methods that commonly omit a body but mis-send Content-Type from mobile/web clients. */
const BODYLESS_METHODS = new Set(["DELETE", "GET", "HEAD", "OPTIONS"]);

function hasRequestBody(req: FastifyRequest): boolean {
  const len = req.headers["content-length"];
  if (len !== undefined && len !== "" && len !== "0") return true;
  const raw = req.raw as { readableLength?: number };
  if (typeof raw.readableLength === "number" && raw.readableLength > 0) {
    return true;
  }
  return false;
}

/**
 * Fastify rejects requests with `Content-Type: application/json` and an empty body.
 * Strip the header when no payload is present so DELETE/POST without body still succeed.
 */
export function normalizeBodylessJsonContentType(req: FastifyRequest): void {
  if (!BODYLESS_METHODS.has(req.method) && req.method !== "POST") return;
  const ct = req.headers["content-type"];
  if (!ct || !String(ct).toLowerCase().includes("application/json")) return;
  if (hasRequestBody(req)) return;
  delete req.headers["content-type"];
}

export function registerBodylessRequestFix(app: FastifyInstance): void {
  app.addHook("onRequest", async (req) => {
    normalizeBodylessJsonContentType(req);
  });
}
