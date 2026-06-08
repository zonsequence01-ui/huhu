import { normalizeInviteCode } from "./invite-code.js";

/** Query param used by web clients for deep links. */
export const INVITE_QUERY_PARAM = "invite";

export function buildInvitePath(code: string): string {
  const normalized = normalizeInviteCode(code);
  return `/?${INVITE_QUERY_PARAM}=${encodeURIComponent(normalized)}`;
}

export function resolvePublicWebBaseUrl(
  envBase: string | undefined,
  requestHost?: string,
): string {
  const trimmed = envBase?.trim();
  if (trimmed) return trimmed.replace(/\/$/, "");
  if (requestHost) {
    const proto =
      requestHost.includes("localhost") || requestHost.startsWith("127.")
        ? "http"
        : "https";
    return `${proto}://${requestHost}`;
  }
  return "";
}

export function buildInviteUrl(baseUrl: string, code: string): string | null {
  const base = baseUrl.trim();
  if (!base) return null;
  return `${base.replace(/\/$/, "")}${buildInvitePath(code)}`;
}

export function parseInviteCodeFromQuery(
  query: Record<string, string | string[] | undefined>,
): string | null {
  const raw = query[INVITE_QUERY_PARAM];
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return null;
  const code = normalizeInviteCode(value);
  return code.length >= 4 ? code : null;
}
