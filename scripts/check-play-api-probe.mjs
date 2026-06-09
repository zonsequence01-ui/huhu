/**
 * Probe Render Play Developer API access (OAuth + Play Console user invite).
 * Usage: pnpm check:play-api
 * Env: RENDER_API_URL (default https://huhu-api.onrender.com)
 */
const base = (process.env.RENDER_API_URL ?? "https://huhu-api.onrender.com").replace(
  /\/$/,
  "",
);

async function main() {
  console.log(`=== Play API probe ===\n${base}/v1/meta/play-api-probe\n`);

  const res = await fetch(`${base}/v1/meta/play-api-probe`, {
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) {
    console.error(`✗ HTTP ${res.status}`);
    process.exit(1);
  }

  const { probe } = await res.json();
  console.log(`configured: ${probe.configured}`);
  console.log(`oauthOk: ${probe.oauthOk}`);
  console.log(`apiAccessOk: ${probe.apiAccessOk}`);
  if (probe.httpStatus) console.log(`httpStatus: ${probe.httpStatus}`);
  if (probe.probeEndpoint) console.log(`probeEndpoint: ${probe.probeEndpoint}`);
  if (probe.reason) console.log(`reason: ${probe.reason}`);

  if (!probe.configured) {
    console.log("\n→ Set Secret File google-play-sa.json (pnpm export:play-api-setup)");
    process.exit(1);
  }
  if (!probe.oauthOk) {
    console.log("\n→ Check SA JSON / private_key validity");
    process.exit(1);
  }
  if (!probe.apiAccessOk) {
    console.log(
      "\n→ Play Console → Users and permissions → Invite user",
    );
    console.log(
      "  https://play.google.com/console/u/0/developers/8174397007390615775/users-and-permissions/invite",
    );
    console.log("  SA: huhu-play-iap@gen-lang-client-0985302942.iam.gserviceaccount.com");
    console.log(
      "  App 呼呼 Huhu: 查看應用程式資訊 + 查看財務資料 + 管理訂單和訂閱",
    );
    console.log("  Details: pnpm export:play-api-setup");
    process.exit(1);
  }

  console.log("\n✓ Play Developer API access OK");
}

await main();
