import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { generateKeyPairSync } from "node:crypto";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  GOOGLE_PLAY_SA_DEFAULT_SECRET_PATH,
  isGooglePlayApiConfigured,
  parseGooglePlayReceipt,
  playApiProbeUrls,
  probeGooglePlayApiAccess,
  probeGooglePlayCatalogAccess,
  probeGooglePlayCatalogSkus,
  resolveGooglePlayServiceAccountPath,
} from "./google-play-verify.js";

describe("google-play-verify", () => {
  const envSnapshot = { ...process.env };

  afterEach(() => {
    process.env = { ...envSnapshot };
    vi.unstubAllEnvs();
  });

  it("parses gp receipt tokens", () => {
    expect(parseGooglePlayReceipt("gp:abc-token")).toEqual({
      purchaseToken: "abc-token",
    });
    expect(
      parseGooglePlayReceipt("gp:com.ctrlz.huhu.coins.small:long-token"),
    ).toEqual({ purchaseToken: "long-token" });
    expect(parseGooglePlayReceipt("invalid")).toBeNull();
  });

  it("loads service account from GOOGLE_PLAY_SERVICE_ACCOUNT_PATH", () => {
    const dir = mkdtempSync(join(tmpdir(), "huhu-sa-"));
    const file = join(dir, "play-sa.json");
    writeFileSync(
      file,
      JSON.stringify({
        client_email: "sa@test.iam.gserviceaccount.com",
        private_key: "-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----\n",
      }),
    );
    process.env.GOOGLE_PLAY_PACKAGE_NAME = "com.ctrlz.huhu";
    process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_PATH = file;
    delete process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON;

    expect(resolveGooglePlayServiceAccountPath()).toBe(file);
    expect(isGooglePlayApiConfigured()).toBe(true);

    rmSync(dir, { recursive: true, force: true });
  });

  it("prefers env JSON over file path", () => {
    process.env.GOOGLE_PLAY_PACKAGE_NAME = "com.ctrlz.huhu";
    process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON = JSON.stringify({
      client_email: "env@test.iam.gserviceaccount.com",
      private_key: "-----BEGIN PRIVATE KEY-----\nxyz\n-----END PRIVATE KEY-----\n",
    });
    process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_PATH = "/nonexistent/path.json";

    expect(isGooglePlayApiConfigured()).toBe(true);
  });

  it("exports default Render secret path constant", () => {
    expect(GOOGLE_PLAY_SA_DEFAULT_SECRET_PATH).toBe(
      "/etc/secrets/google-play-sa.json",
    );
  });

  it("probe returns not_configured without credentials", async () => {
    delete process.env.GOOGLE_PLAY_PACKAGE_NAME;
    delete process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON;
    delete process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_PATH;

    await expect(probeGooglePlayApiAccess()).resolves.toEqual({
      configured: false,
      oauthOk: false,
      apiAccessOk: false,
      reason: "not_configured",
    });
  });

  it("playApiProbeUrls prefers oneTimeProducts then legacy catalog", () => {
    const urls = playApiProbeUrls("com.ctrlz.huhu");
    expect(urls[0]).toContain("/oneTimeProducts?pageSize=1");
    expect(urls[1]).toContain("/inappproducts?maxResults=1");
    expect(urls[2]).toContain("/subscriptions?maxResults=1");
  });

  it("probeGooglePlayCatalogAccess falls through to legacy inappproducts", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/oneTimeProducts")) {
          return new Response("{}", { status: 403 });
        }
        if (url.includes("/inappproducts")) {
          return new Response("{}", { status: 200 });
        }
        return new Response("{}", { status: 404 });
      }),
    );

    await expect(
      probeGooglePlayCatalogAccess("tok", "com.ctrlz.huhu"),
    ).resolves.toEqual({
      apiAccessOk: true,
      httpStatus: 200,
      probeEndpoint: "inappproducts",
    });
  });

  it("probeGooglePlayCatalogAccess prefers oneTimeProducts when available", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/oneTimeProducts")) {
          return new Response("{}", { status: 200 });
        }
        return new Response("{}", { status: 403 });
      }),
    );

    await expect(
      probeGooglePlayCatalogAccess("tok", "com.ctrlz.huhu"),
    ).resolves.toEqual({
      apiAccessOk: true,
      httpStatus: 200,
      probeEndpoint: "oneTimeProducts",
    });
  });

  it("probeGooglePlayCatalogSkus reports missing SKUs", async () => {
    const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
    const private_key = privateKey.export({ type: "pkcs8", format: "pem" });
    process.env.GOOGLE_PLAY_PACKAGE_NAME = "com.ctrlz.huhu";
    process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON = JSON.stringify({
      client_email: "sa@test.iam.gserviceaccount.com",
      private_key,
    });

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("oauth2.googleapis.com/token")) {
          return new Response(JSON.stringify({ access_token: "tok" }), {
            status: 200,
          });
        }
        if (url.includes("/oneTimeProducts?pageSize=1")) {
          return new Response("{}", { status: 200 });
        }
        if (url.includes("/oneTimeProducts?pageSize=50")) {
          return new Response(
            JSON.stringify({
              oneTimeProducts: [{ productId: "com.ctrlz.huhu.coins.small" }],
            }),
            { status: 200 },
          );
        }
        if (url.includes("/subscriptions?maxResults=50")) {
          return new Response(
            JSON.stringify({
              subscriptions: [{ productId: "com.ctrlz.huhu.sub.lite" }],
            }),
            { status: 200 },
          );
        }
        return new Response("{}", { status: 404 });
      }),
    );

    const result = await probeGooglePlayCatalogSkus();
    expect(result.catalogReady).toBe(false);
    expect(result.missingOneTime).toEqual([
      "com.ctrlz.huhu.coins.large",
      "com.ctrlz.huhu.coins.medium",
    ]);
    expect(result.missingSubscriptions).toEqual([
      "com.ctrlz.huhu.sub.basic",
      "com.ctrlz.huhu.sub.premium",
    ]);
  });
});
