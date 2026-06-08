import { afterEach, describe, expect, it } from "vitest";
import {
  decodeJwsPayloadUnsafe,
  verifyAppStoreJwsTransaction,
} from "./apple-app-store-server.js";
import { verifyAppleX5cChain } from "./apple-x5c-chain.js";
import {
  resetTrustedAppleRootsCache,
  verifyX5cAnchorsToTrustedRoots,
} from "./apple-trusted-roots.js";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

function buildTestJws(payload: Record<string, unknown>): string {
  const header = Buffer.from('{"alg":"ES256"}', "utf8").toString("base64url");
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url",
  );
  const sig = Buffer.from("sig", "utf8").toString("base64url");
  return `${header}.${body}.${sig}`;
}

describe("verifyX5cAnchorsToTrustedRoots", () => {
  afterEach(() => {
    resetTrustedAppleRootsCache();
  });

  it("accepts chain containing bundled Apple Root CA G3", () => {
    const pem = readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        "../../certs/apple-root-ca-g3.pem",
      ),
      "utf8",
    );
    const der = pem
      .replace(/-----BEGIN CERTIFICATE-----/g, "")
      .replace(/-----END CERTIFICATE-----/g, "")
      .replace(/\s/g, "");
    expect(verifyX5cAnchorsToTrustedRoots([der])).toBe(true);
  });

  it("accepts chain containing bundled Apple Root CA G2", () => {
    const pem = readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        "../../certs/apple-root-ca-g2.pem",
      ),
      "utf8",
    );
    const der = pem
      .replace(/-----BEGIN CERTIFICATE-----/g, "")
      .replace(/-----END CERTIFICATE-----/g, "")
      .replace(/\s/g, "");
    expect(verifyX5cAnchorsToTrustedRoots([der])).toBe(true);
  });
});

describe("verifyAppleX5cChain", () => {
  it("allows single leaf certificate", () => {
    expect(verifyAppleX5cChain(["abc"])).toBe(true);
  });

  it("rejects broken multi-cert chain", () => {
    expect(verifyAppleX5cChain(["a", "b"])).toBe(false);
  });
});

describe("verifyAppStoreJwsTransaction", () => {
  const env = process.env;

  afterEach(() => {
    process.env = { ...env };
  });

  it("accepts dev valid_jws receipt", async () => {
    const r = await verifyAppStoreJwsTransaction(
      "valid_jws_com.ctrlz.huhu.coins.small",
      "com.ctrlz.huhu.coins.small",
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.store).toBe("dev_jws_receipt");
  });

  it("rejects JWS without x5c when signature verify enabled", async () => {
    process.env.APPLE_APP_STORE_BUNDLE_ID = "com.ctrlz.huhu";
    delete process.env.APPLE_APP_STORE_JWS_DECODE_ONLY;
    const jws = buildTestJws({
      productId: "com.ctrlz.huhu.coins.small",
      bundleId: "com.ctrlz.huhu",
    });
    const r = await verifyAppStoreJwsTransaction(
      jws,
      "com.ctrlz.huhu.coins.small",
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("missing_x5c_certificate");
  });

  it("decodes JWS payload when decode-only enabled", async () => {
    process.env.APPLE_APP_STORE_JWS_DECODE_ONLY = "1";
    process.env.APPLE_APP_STORE_BUNDLE_ID = "com.ctrlz.huhu";
    process.env.NODE_ENV = "test";
    const jws = buildTestJws({
      productId: "com.ctrlz.huhu.coins.small",
      bundleId: "com.ctrlz.huhu",
    });
    const r = await verifyAppStoreJwsTransaction(
      jws,
      "com.ctrlz.huhu.coins.small",
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.store).toBe("apple_jws_decode_only");
    expect(decodeJwsPayloadUnsafe(jws)?.productId).toBe(
      "com.ctrlz.huhu.coins.small",
    );
  });
});
