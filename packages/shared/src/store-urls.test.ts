import { describe, expect, it } from "vitest";
import {
  getStoreUrls,
  STORE_PRIVACY_URL,
  STORE_PUBLIC_SITE_URL,
  STORE_SUPPORT_URL,
  STORE_URLS,
} from "./store-urls.js";

describe("store-urls", () => {
  it("exposes https support and privacy paths", () => {
    expect(STORE_PUBLIC_SITE_URL).toMatch(/^https:\/\//);
    expect(STORE_SUPPORT_URL).toBe(`${STORE_PUBLIC_SITE_URL}/support`);
    expect(STORE_PRIVACY_URL).toBe(`${STORE_PUBLIC_SITE_URL}/privacy`);
    expect(STORE_URLS.bundleId).toBe("com.ctrlz.huhu");
  });

  it("getStoreUrls honors explicit site override", () => {
    const urls = getStoreUrls("https://cdn.example.com/");
    expect(urls.site).toBe("https://cdn.example.com");
    expect(urls.support).toBe("https://cdn.example.com/support");
  });
});
