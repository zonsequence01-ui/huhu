/**
 * Validate iOS project config for App Store release (no IPA build on Windows).
 * Usage: pnpm validate:ios-config
 */
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { BUNDLE_ID } from "@huhu/shared";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pbxproj = join(root, "apps/mobile/ios/Runner.xcodeproj/project.pbxproj");
const infoPlist = join(root, "apps/mobile/ios/Runner/Info.plist");
const pubspec = join(root, "apps/mobile/pubspec.yaml");

let failed = false;

function fail(msg) {
  console.error(`✗ ${msg}`);
  failed = true;
}

function ok(msg) {
  console.log(`✓ ${msg}`);
}

if (!existsSync(pbxproj)) {
  fail("missing Runner.xcodeproj/project.pbxproj");
} else {
  const text = readFileSync(pbxproj, "utf8");
  const mainIds = (text.match(/PRODUCT_BUNDLE_IDENTIFIER = ([^;]+);/g) ?? [])
    .map((line) => line.replace("PRODUCT_BUNDLE_IDENTIFIER = ", "").replace(";", "").trim())
    .filter((id) => !id.includes("RunnerTests"));
  const unique = [...new Set(mainIds)];
  if (unique.length === 1 && unique[0] === BUNDLE_ID) {
    ok(`bundle ID ${BUNDLE_ID}`);
  } else {
    fail(`bundle ID mismatch in pbxproj: ${unique.join(", ")}`);
  }
  if (text.includes("com.ctrlz.huhuMobile")) {
    fail("stale com.ctrlz.huhuMobile identifier in pbxproj");
  } else {
    ok("no huhuMobile stale bundle id");
  }
}

if (!existsSync(infoPlist)) {
  fail("missing Info.plist");
} else {
  const plist = readFileSync(infoPlist, "utf8");
  if (plist.includes("<string>呼呼 Huhu</string>")) {
    ok("CFBundleDisplayName 呼呼 Huhu");
  } else {
    fail("Info.plist CFBundleDisplayName should be 呼呼 Huhu");
  }
  ok("Info.plist present");
}

if (!existsSync(pubspec)) {
  fail("missing pubspec.yaml");
} else {
  const ps = readFileSync(pubspec, "utf8");
  if (ps.includes("in_app_purchase")) {
    ok("in_app_purchase dependency");
  } else {
    fail("missing in_app_purchase in pubspec.yaml");
  }
  if (ps.includes("url_launcher")) {
    ok("url_launcher dependency");
  } else {
    fail("missing url_launcher in pubspec.yaml");
  }
}

const apiConfig = join(root, "apps/mobile/lib/config/api_config.dart");
if (existsSync(apiConfig)) {
  const cfg = readFileSync(apiConfig, "utf8");
  if (cfg.includes("https://huhu-app.pages.dev")) {
    ok("release API base https://huhu-app.pages.dev");
  } else {
    fail("api_config.dart missing production API URL");
  }
  if (cfg.includes("127.0.0.1:3000")) {
    ok("iOS/desktop debug loopback 127.0.0.1:3000");
  } else {
    fail("api_config.dart missing local debug API URL");
  }
} else {
  fail("missing apps/mobile/lib/config/api_config.dart");
}

const ascReadme = join(root, "dist/app-store-connect/README.md");
if (existsSync(ascReadme)) {
  ok("dist/app-store-connect");
} else {
  console.log("○ dist/app-store-connect — run pnpm export:app-store-connect");
}

if (failed) process.exit(1);
console.log("iOS config validation OK");
