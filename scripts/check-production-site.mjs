/**

 * Verify production DNS + store-required URLs (privacy/support) and optional /health.

 * Usage: pnpm check:site

 * Env:

 *   PROD_SMOKE_URL — override base (default STORE_PUBLIC_SITE_URL)

 *   CHECK_SITE_REQUIRE_HEALTH=1 — fail if /health not 200 (Phase 2 API)

 * Exit 0 when privacy + support return 200; exit 1 otherwise.

 */

import dns from "node:dns/promises";

import { getStoreUrls, STORE_PUBLIC_SITE_URL } from "@huhu/shared";



const base = (

  process.env.PROD_SMOKE_URL ?? STORE_PUBLIC_SITE_URL

).replace(/\/$/, "");

const { privacy, support } = getStoreUrls(base);

const host = new URL(base).hostname;

const requireHealth = process.env.CHECK_SITE_REQUIRE_HEALTH === "1";



let failed = false;



console.log(`=== Production site check ===\n`);

console.log(`Base: ${base}`);

console.log(`Host: ${host}\n`);



try {

  const records = await dns.lookup(host, { all: true });

  const addrs = records.map((r) => `${r.address} (${r.family === 6 ? "AAAA" : "A"})`);

  console.log(`✓ DNS ${host} → ${addrs.join(", ")}`);

} catch (err) {

  const code = err.code ?? err.message;

  console.error(`✗ DNS ${host}: ${code}`);

  console.error(

    "  → Deploy static pages: pnpm deploy:pages (Cloudflare Pages on your account)",

  );

  failed = true;

}



async function probe(url, label, required = true) {

  try {

    const res = await fetch(url, {

      method: "GET",

      redirect: "follow",

      signal: AbortSignal.timeout(15_000),

    });

    const ct = res.headers.get("content-type") ?? "";

    if (res.ok) {

      console.log(`✓ ${label} HTTP ${res.status}${ct ? ` (${ct.split(";")[0]})` : ""}`);

      return true;

    }

    console.error(`✗ ${label} HTTP ${res.status}`);

    if (required) failed = true;

    return false;

  } catch (err) {

    console.error(`✗ ${label}: ${err.message}`);

    if (required) failed = true;

    return false;

  }

}



await probe(privacy, "privacy", true);

await probe(support, "support", true);



if (requireHealth) {

  await probe(`${base}/health`, "/health", true);

} else {

  const healthOk = await probe(`${base}/health`, "/health", false);

  if (!healthOk) {

    console.log(

      "○ /health not ready (Phase 1 static OK — run Phase 2 API for full stack)",

    );

  }

}



if (failed) {

  console.error("\nProduction site check FAILED.");

  console.error("Deploy: pnpm deploy:pages  (requires CLOUDFLARE_API_TOKEN)");

  process.exit(1);

}



console.log("\nProduction site check OK (store privacy/support reachable).");

process.exit(0);


