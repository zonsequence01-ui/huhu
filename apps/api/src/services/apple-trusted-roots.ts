import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { X509Certificate } from "node:crypto";
import {
  verifyAppleX5cChain,
  pemFromDerBase64,
} from "./apple-x5c-chain.js";

const certsDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../certs",
);

let cachedRoots: X509Certificate[] | null = null;

function splitPemBlocks(pem: string): string[] {
  const blocks: string[] = [];
  const re = /-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(pem)) !== null) {
    blocks.push(m[0]!);
  }
  return blocks;
}

/** Loads Apple Root CA PEM(s) from env or bundled G3. */
export function loadTrustedAppleRoots(): X509Certificate[] {
  if (cachedRoots) return cachedRoots;
  const roots: X509Certificate[] = [];
  const envPem = process.env.APPLE_APP_STORE_TRUSTED_ROOTS_PEM?.trim();
  if (envPem) {
    for (const block of splitPemBlocks(envPem)) {
      try {
        roots.push(new X509Certificate(block));
      } catch {
        /* skip invalid block */
      }
    }
  }
  for (const name of ["apple-root-ca-g3.pem", "apple-root-ca-g2.pem"]) {
    const path = join(certsDir, name);
    if (!existsSync(path)) continue;
    try {
      roots.push(new X509Certificate(readFileSync(path, "utf8")));
    } catch {
      /* skip */
    }
  }
  cachedRoots = roots;
  return roots;
}

export function isAppleRootPinningEnabled(): boolean {
  if (process.env.APPLE_APP_STORE_ROOT_PIN === "0") return false;
  return loadTrustedAppleRoots().length > 0;
}

/** Ensures x5c chain is valid and terminates at a trusted Apple root. */
export function verifyX5cAnchorsToTrustedRoots(x5c: string[]): boolean {
  if (!verifyAppleX5cChain(x5c)) return false;
  const roots = loadTrustedAppleRoots();
  if (roots.length === 0) return true;

  const trustedFp = new Set<string>();
  for (const root of roots) {
    if (root.fingerprint256) trustedFp.add(root.fingerprint256);
    if (root.fingerprint) trustedFp.add(root.fingerprint);
  }

  for (const der of x5c) {
    try {
      const cert = new X509Certificate(pemFromDerBase64(der));
      const fp = cert.fingerprint256 ?? cert.fingerprint;
      if (fp && trustedFp.has(fp)) return true;
      if (roots.some((root) => root.checkIssued(cert))) return true;
    } catch {
      /* next cert */
    }
  }
  return false;
}

/** Clears cached roots (tests only). */
export function resetTrustedAppleRootsCache(): void {
  cachedRoots = null;
}
