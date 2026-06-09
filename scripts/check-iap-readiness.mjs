/**
 * Print IAP configuration checklist (requires API build).
 * Usage: pnpm check:iap
 */
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const modPath = join(root, "apps/api/dist/services/iap-readiness.js");

let getIapReadiness;
try {
  ({ getIapReadiness } = await import(pathToFileURL(modPath).href));
} catch (err) {
  console.error("Run `pnpm build` first (missing apps/api/dist).");
  if (process.env.DEBUG) console.error(err);
  process.exit(2);
}

const r = getIapReadiness();
const lines = [
  `IAP_STRICT=${r.strict}`,
  `mockDevAllowed=${r.mockDevAllowed}`,
  `productionReady=${r.productionReady}`,
  `androidProductionReady=${r.androidProductionReady ?? false}`,
  `iosProductionReady=${r.iosProductionReady ?? false}`,
  `iOS configured=${r.ios.configured} (legacy=${r.ios.legacyReceipt}, jws=${r.ios.appStoreJws})`,
  `Android configured=${r.android.configured} (playApi=${r.android.playApi}, packageName=${r.android.packageName}, stub=${r.android.stub})`,
];

if (!r.productionReady) {
  const missing = [];
  if (!r.strict) missing.push("IAP_STRICT=true");
  if (!r.iosProductionReady) missing.push("Apple credentials (iOS)");
  if (!r.androidProductionReady) {
    missing.push(
      "GOOGLE_PLAY_PACKAGE_NAME + SA (Secret File or GOOGLE_PLAY_SERVICE_ACCOUNT_JSON)",
    );
  }
  if (process.env.NODE_ENV !== "production") {
    missing.push("NODE_ENV=production");
  }
  lines.push(`Missing for production: ${missing.join(", ")}`);
}

console.log(lines.join("\n"));
process.exit(r.productionReady ? 0 : 1);
