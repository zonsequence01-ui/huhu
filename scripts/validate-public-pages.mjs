/**
 * Validate store support/privacy static pages and shared URL constants.
 * Usage: pnpm validate:public-pages
 */
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BUNDLE_ID,
  STORE_PRIVACY_URL,
  STORE_PUBLIC_SITE_URL,
  STORE_SUPPORT_URL,
} from "@huhu/shared";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const webDir = join(root, "apps/web");

function assertHttpsUrl(url, label) {
  if (!url.startsWith("https://")) {
    throw new Error(`${label} must be https URL`);
  }
}

let failed = false;

try {
  assertHttpsUrl(STORE_PUBLIC_SITE_URL, "STORE_PUBLIC_SITE_URL");
  assertHttpsUrl(STORE_SUPPORT_URL, "STORE_SUPPORT_URL");
  assertHttpsUrl(STORE_PRIVACY_URL, "STORE_PRIVACY_URL");
  if (!STORE_SUPPORT_URL.endsWith("/support")) {
    throw new Error("STORE_SUPPORT_URL must end with /support");
  }
  if (!STORE_PRIVACY_URL.endsWith("/privacy")) {
    throw new Error("STORE_PRIVACY_URL must end with /privacy");
  }
  console.log(`ok urls support=${STORE_SUPPORT_URL}`);
} catch (err) {
  console.error(`invalid store urls: ${err.message}`);
  failed = true;
}

for (const file of ["support.html", "privacy.html"]) {
  const path = join(webDir, file);
  if (!existsSync(path)) {
    console.error(`missing ${path}`);
    failed = true;
    continue;
  }
  const html = readFileSync(path, "utf8");
  if (!html.includes(BUNDLE_ID)) {
    console.error(`${file} missing bundleId ${BUNDLE_ID}`);
    failed = true;
    continue;
  }
  if (!html.toLowerCase().includes("<!doctype html")) {
    console.error(`${file} missing doctype`);
    failed = true;
    continue;
  }
  console.log(`ok ${file}`);
}

const ascUrls = join(root, "dist/app-store-connect/urls.json");
if (existsSync(ascUrls)) {
  const data = JSON.parse(readFileSync(ascUrls, "utf8"));
  if (data.support !== STORE_SUPPORT_URL || data.privacy !== STORE_PRIVACY_URL) {
    console.error("dist/app-store-connect/urls.json stale — run export:app-store-connect");
    failed = true;
  } else {
    console.log("ok dist/app-store-connect/urls.json");
  }
} else {
  console.log("○ dist/app-store-connect/urls.json — pnpm export:app-store-connect");
}

if (failed) process.exit(1);
