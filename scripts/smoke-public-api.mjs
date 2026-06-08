/**
 * Smoke-test public API meta endpoints (no auth).
 * Usage: pnpm smoke:api
 * Env: SMOKE_BASE_URL (default http://127.0.0.1:3000)
 */
import {
  API_ERROR_CODES,
  BUNDLE_ID,
  assertPublicMeta,
} from "@huhu/shared";

const base = (process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3000").replace(
  /\/$/,
  "",
);

async function get(path) {
  const res = await fetch(`${base}${path}`);
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`${path} invalid JSON (${res.status})`);
  }
  if (!res.ok) {
    throw new Error(`${path} HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  return json;
}

const checks = [
  {
    name: "health",
    path: "/health",
    assert: (b) => {
      const ok =
        b.status === "ok" &&
        b.bundleId === "com.ctrlz.huhu" &&
        assertPublicMeta(b.publicMeta) &&
        typeof b.security?.jwtSecretConfigured === "boolean" &&
        typeof b.deployment?.storePublicSiteUrl === "string";
      if (!ok) return false;
      if (base.startsWith("https://")) {
        return (
          b.security.jwtSecretConfigured === true &&
          b.deployment.storePublicSiteUrl.startsWith("https://")
        );
      }
      return true;
    },
  },
  {
    name: "economy",
    path: "/v1/meta/economy",
    assert: (b) => b.economy?.stamina?.max === 50,
  },
  {
    name: "client-config",
    path: "/v1/meta/client-config?locale=zh-TW",
    assert: (b) =>
      b.config?.economy?.stamina?.max === 50 &&
      b.config?.offerwall?.sdkIntegration === "hmac_only" &&
      b.config?.supportResources?.privacyReminder?.length > 10 &&
      b.config?.storeUrls?.support?.includes("/support") &&
      b.config?.storeUrls?.privacy?.includes("/privacy") &&
      (b.config?.subscriptionTiers ?? []).length === 3 &&
      b.config.subscriptionTiers.some(
        (t) =>
          t.tier === "basic" &&
          t.entitlements?.voice &&
          (t.entitlementsLabel?.length ?? 0) > 5 &&
          (t.tierDisplayName?.length ?? 0) > 0,
      ) &&
      (b.config.subscriptionTiersPrompt?.includes("基礎") ||
        b.config.subscriptionTiersPrompt?.includes("Basic")) &&
      b.config.apiErrors &&
      Object.keys(b.config.apiErrors).sort().join() ===
        [...API_ERROR_CODES].sort().join() &&
      (b.config.apiErrors.content_required?.length ?? 0) > 2 &&
      (b.config.apiErrors.insufficient_stamina?.length ?? 0) > 2,
  },
  {
    name: "offerwall",
    path: "/v1/meta/offerwall",
    assert: (b) =>
      ["dev_direct", "verified"].includes(b.offerwall?.mode) &&
      b.offerwall?.endpoints?.claim === "/v1/rewards/offerwall",
  },
  {
    name: "iap-products",
    path: "/v1/meta/iap-products",
    assert: (b) =>
      (b.subscriptions ?? []).some((s) =>
        String(s.productId ?? "").includes("com.ctrlz.huhu.sub.lite"),
      ),
  },
  {
    name: "support-resources",
    path: "/v1/meta/support-resources?locale=zh-TW",
    assert: (b) => (b.resources?.privacyReminder?.length ?? 0) > 10,
  },
  {
    name: "iap-readiness",
    path: "/v1/meta/iap-readiness",
    assert: (b) => typeof b.readiness?.productionReady === "boolean",
  },
];

let failed = false;
console.log(`Smoke public API @ ${base}\n`);

for (const c of checks) {
  try {
    const body = await get(c.path);
    if (!c.assert(body)) {
      console.error(`✗ ${c.name} assertion failed`);
      failed = true;
      continue;
    }
    console.log(`✓ ${c.name}`);
  } catch (err) {
    console.error(`✗ ${c.name}: ${err.message}`);
    failed = true;
  }
}

for (const page of ["/support", "/privacy", "/support.html", "/privacy.html"]) {
  try {
    const res = await fetch(`${base}${page}`);
    const html = await res.text();
    if (!res.ok || !html.includes(BUNDLE_ID)) {
      console.error(`✗ ${page} HTTP ${res.status}`);
      failed = true;
      continue;
    }
    console.log(`✓ ${page}`);
  } catch (err) {
    console.error(`✗ ${page}: ${err.message}`);
    failed = true;
  }
}

if (failed) {
  console.error(
    "\nSmoke FAILED — is the API running with current source? (pnpm smoke:api:local / pnpm dev)",
  );
  process.exit(1);
}

console.log("\nSmoke OK");
