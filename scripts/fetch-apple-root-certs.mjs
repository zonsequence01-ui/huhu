#!/usr/bin/env node
/**
 * Downloads Apple Root CA G2/G3 DER certs and writes PEM files for JWS x5c pinning.
 * Run: node scripts/fetch-apple-root-certs.mjs
 */
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { X509Certificate } from "node:crypto";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const certsDir = join(root, "apps/api/certs");

const SOURCES = [
  {
    url: "https://www.apple.com/certificateauthority/AppleRootCA-G2.cer",
    pemName: "apple-root-ca-g2.pem",
  },
  {
    url: "https://www.apple.com/certificateauthority/AppleRootCA-G3.cer",
    pemName: "apple-root-ca-g3.pem",
  },
];

async function main() {
  await mkdir(certsDir, { recursive: true });
  for (const { url, pemName } of SOURCES) {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`fetch failed ${url}: ${res.status}`);
    }
    const der = Buffer.from(await res.arrayBuffer());
    const pem = new X509Certificate(der).toString();
    const out = join(certsDir, pemName);
    await writeFile(out, pem, "utf8");
    const existing = await readFile(out, "utf8");
    if (!existing.includes("BEGIN CERTIFICATE")) {
      throw new Error(`invalid pem written: ${pemName}`);
    }
    console.log(`wrote ${pemName}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
