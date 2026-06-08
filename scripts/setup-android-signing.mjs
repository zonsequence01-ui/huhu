/**
 * Create upload keystore + key.properties for Play Console release builds.
 * Usage: pnpm setup:android-signing
 * Files are gitignored (see apps/mobile/android/.gitignore).
 */
import { existsSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const androidDir = join(root, "apps/mobile/android");
const keyProps = join(androidDir, "key.properties");
const keystore = join(androidDir, "upload-keystore.jks");

if (existsSync(keyProps) && existsSync(keystore)) {
  console.log("✓ Android signing already configured");
  process.exit(0);
}

const password = randomBytes(12).toString("base64url");
const dname =
  "CN=呼呼 Huhu, OU=Mobile, O=CTRL//Z, L=Taipei, ST=Taiwan, C=TW";

const keytool = spawnSync(
  "keytool",
  [
    "-genkeypair",
    "-v",
    "-keystore",
    keystore,
    "-alias",
    "upload",
    "-keyalg",
    "RSA",
    "-keysize",
    "2048",
    "-validity",
    "10000",
    "-storepass",
    password,
    "-keypass",
    password,
    "-dname",
    dname,
  ],
  { encoding: "utf8" },
);

if (keytool.status !== 0) {
  console.error(keytool.stderr || keytool.stdout || "keytool failed");
  console.error(
    "Ensure JDK keytool is on PATH (Android Studio / JAVA_HOME).",
  );
  process.exit(1);
}

writeFileSync(
  keyProps,
  [
    `storePassword=${password}`,
    `keyPassword=${password}`,
    "keyAlias=upload",
    "storeFile=upload-keystore.jks",
    "",
  ].join("\n"),
  "utf8",
);

console.log(`✓ wrote ${keystore}`);
console.log(`✓ wrote ${keyProps}`);
console.log(
  "Back up upload-keystore.jks and key.properties securely; Play App Signing will re-sign for users.",
);
