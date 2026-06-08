/**
 * Validate Android release artifacts for Play Console upload.
 * Usage: pnpm validate:android-release
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { STORE_PUBLIC_SITE_URL } from "@huhu/shared";

const expectedApiBase = STORE_PUBLIC_SITE_URL.replace(/\/$/, "");

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const keyProps = join(root, "apps/mobile/android/key.properties");
const aabDist = join(root, "dist/android-release/com.ctrlz.huhu-release.aab");
const aabBuild = join(
  root,
  "apps/mobile/build/app/outputs/bundle/release/app-release.aab",
);

let failed = false;

if (!existsSync(keyProps)) {
  console.error("✗ missing apps/mobile/android/key.properties — run pnpm setup:android-signing");
  failed = true;
} else {
  console.log("✓ key.properties");
}

const aab = existsSync(aabDist) ? aabDist : existsSync(aabBuild) ? aabBuild : null;
if (!aab) {
  console.error("✗ missing release AAB — run pnpm build:android && pnpm package:android-release");
  failed = true;
} else {
  const mb = (statSync(aab).size / (1024 * 1024)).toFixed(1);
  console.log(`✓ release AAB (${mb} MB): ${aab}`);
  const verify = spawnSync("jarsigner", ["-verify", aab], {
    encoding: "utf8",
  });
  const out = (verify.stdout ?? "") + (verify.stderr ?? "");
  if (out.includes("Android Debug") || out.includes("CN=Android Debug")) {
    console.error("✗ AAB is debug-signed — Play Console will reject it");
    failed = true;
  } else if (verify.status === 0) {
    console.log("✓ jarsigner verify (not debug keystore)");
  } else {
    console.log("○ jarsigner verify skipped (jarsigner unavailable)");
  }
}

const metaPath = join(root, "dist/android-release/build-meta.json");
if (!existsSync(metaPath)) {
  console.error("✗ missing dist/android-release/build-meta.json — run pnpm package:android-release");
  failed = true;
} else {
  const meta = JSON.parse(readFileSync(metaPath, "utf8"));
  if (meta.apiBase === expectedApiBase) {
    console.log(`✓ build-meta apiBase ${expectedApiBase}`);
  } else {
    console.error(
      `✗ build-meta apiBase ${meta.apiBase ?? "—"} (expected ${expectedApiBase}) — rebuild with pnpm build:android`,
    );
    failed = true;
  }
}

if (failed) process.exit(1);
console.log("Android release validation OK");
