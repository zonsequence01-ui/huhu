import { BUNDLE_ID } from "./constants.js";

/**
 * Public site base URL for App Store / Play support & privacy links.
 * Hosted on the user's Cloudflare account (not ctrlz.dev).
 * Runtime override: `STORE_PUBLIC_SITE_URL` env (no trailing slash).
 */
export const STORE_PUBLIC_SITE_URL = "https://huhu-app.pages.dev";

export const STORE_SUPPORT_URL = `${STORE_PUBLIC_SITE_URL}/support`;
export const STORE_PRIVACY_URL = `${STORE_PUBLIC_SITE_URL}/privacy`;

export type StoreUrls = {
  bundleId: string;
  site: string;
  support: string;
  privacy: string;
};

export function getStoreUrls(siteOverride?: string): StoreUrls {
  const raw =
    siteOverride?.trim() ||
    (typeof process !== "undefined"
      ? process.env.STORE_PUBLIC_SITE_URL?.trim()
      : undefined) ||
    STORE_PUBLIC_SITE_URL;
  const site = raw.replace(/\/$/, "");
  return {
    bundleId: BUNDLE_ID,
    site,
    support: `${site}/support`,
    privacy: `${site}/privacy`,
  };
}

export const STORE_URLS: StoreUrls = getStoreUrls();
