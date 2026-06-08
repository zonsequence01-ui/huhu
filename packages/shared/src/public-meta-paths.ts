/** Public meta API paths indexed on GET /health (keep clients/smoke in sync). */
export const PUBLIC_META_PATHS = {
  clientConfig: "/v1/meta/client-config",
  economy: "/v1/meta/economy",
  offerwall: "/v1/meta/offerwall",
  iapProducts: "/v1/meta/iap-products",
  supportResources: "/v1/meta/support-resources",
} as const;

export type PublicMetaPaths = typeof PUBLIC_META_PATHS;

export function assertPublicMeta(
  publicMeta: Record<string, unknown> | null | undefined,
): publicMeta is PublicMetaPaths {
  if (!publicMeta || typeof publicMeta !== "object") return false;
  for (const [key, path] of Object.entries(PUBLIC_META_PATHS)) {
    if (publicMeta[key] !== path) return false;
  }
  return true;
}
