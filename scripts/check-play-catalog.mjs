/**
 * Verify Play Console IAP SKUs match expected Android catalog.
 * Usage: pnpm check:play-catalog
 * Env: RENDER_API_URL (default https://huhu-api.onrender.com)
 */
import { renderApiBase } from "./lib/render-prod.mjs";

const base = renderApiBase();

async function main() {
  console.log(`=== Play catalog probe ===\n${base}/v1/meta/play-catalog-probe\n`);

  let res;
  try {
    res = await fetch(`${base}/v1/meta/play-catalog-probe`, {
      signal: AbortSignal.timeout(60_000),
    });
  } catch (err) {
    console.error(`✗ unreachable: ${err.message ?? err}`);
    process.exit(1);
  }

  if (res.status === 404) {
    console.error(
      "✗ endpoint not deployed yet — push API with play-catalog-probe and redeploy Render",
    );
    process.exit(1);
  }

  if (!res.ok) {
    console.error(`✗ HTTP ${res.status}`);
    process.exit(1);
  }

  const { catalog } = await res.json();
  const c = catalog ?? {};

  console.log(`configured: ${c.configured}`);
  console.log(`oauthOk: ${c.oauthOk}`);
  console.log(`apiAccessOk: ${c.apiAccessOk}`);
  console.log(`catalogReady: ${c.catalogReady ?? false}`);

  if (c.subscriptionProductIds?.length) {
    console.log(`subscriptions (${c.subscriptionProductIds.length}): ${c.subscriptionProductIds.join(", ")}`);
  }
  if (c.oneTimeProductIds?.length) {
    console.log(`one-time (${c.oneTimeProductIds.length}): ${c.oneTimeProductIds.join(", ")}`);
  }

  if (c.missingSubscriptions?.length) {
    console.log(`missing subscriptions: ${c.missingSubscriptions.join(", ")}`);
  }
  if (c.missingOneTime?.length) {
    console.log(`missing one-time: ${c.missingOneTime.join(", ")}`);
  }

  if (!c.configured || !c.oauthOk || !c.apiAccessOk) {
    console.log("\n→ Fix Play SA / API access: pnpm export:play-api-setup");
    process.exit(1);
  }

  if (!c.catalogReady) {
    console.log("\n→ Create missing SKUs in Play Console (dist/play-iap-products/README.md)");
    process.exit(1);
  }

  console.log("\n✓ Play IAP catalog complete");
}

await main();
