/**
 * Verify Render production API (cold-start tolerant).
 * Usage: pnpm check:render
 * Env: RENDER_API_URL (default https://huhu-api.onrender.com)
 * Env: CHECK_RENDER_REQUIRE_POSTGRES=0 to skip postgres/pgvector assertion
 */
const base = (process.env.RENDER_API_URL ?? "https://huhu-api.onrender.com").replace(
  /\/$/,
  "",
);

const maxAttempts = 12;
const delayMs = 5000;

async function wait(ms) {
  await new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log(`=== Render API check ===\n${base}\n`);

  for (let i = 1; i <= maxAttempts; i++) {
    try {
      const res = await fetch(`${base}/health`, { signal: AbortSignal.timeout(60_000) });
      if (res.ok) {
        const body = await res.json();
        if (body?.status !== "ok" || !body?.security?.jwtSecretConfigured) {
          console.error("✗ /health unexpected body");
          process.exit(1);
        }
        const requirePostgres = process.env.CHECK_RENDER_REQUIRE_POSTGRES !== "0";
        if (requirePostgres && body.database !== "postgres") {
          console.error(`✗ expected database=postgres, got ${body.database}`);
          process.exit(1);
        }
        if (requirePostgres && body.vectorStore !== "pgvector") {
          console.error(`✗ expected vectorStore=pgvector, got ${body.vectorStore}`);
          process.exit(1);
        }
        const rl = body.rateLimit?.backend ?? "unknown";
        console.log(
          `✓ /health OK (attempt ${i}, database=${body.database}, vectorStore=${body.vectorStore}, rateLimit=${rl})`,
        );

        try {
          const iapRes = await fetch(`${base}/v1/meta/iap-readiness`, {
            signal: AbortSignal.timeout(30_000),
          });
          if (iapRes.ok) {
            const iap = await iapRes.json();
            const r = iap.readiness ?? iap;
            console.log(
              `  iap-readiness: productionReady=${r.productionReady} strict=${r.strict} playApi=${r.android?.playApi ?? false}`,
            );
            if (r.android?.playApi === false) {
              console.log(
                "  → Set Play SA via Render Secret File google-play-sa.json (pnpm export:play-api-setup)",
              );
            } else if (r.android?.playApi === true) {
              try {
                const probeRes = await fetch(`${base}/v1/meta/play-api-probe`, {
                  signal: AbortSignal.timeout(45_000),
                });
                if (probeRes.ok) {
                  const { probe } = await probeRes.json();
                  console.log(
                    `  play-api-probe: oauth=${probe.oauthOk} apiAccess=${probe.apiAccessOk}${probe.probeEndpoint ? ` endpoint=${probe.probeEndpoint}` : ""}${probe.reason ? ` (${probe.reason})` : ""}`,
                  );
                  if (probe.oauthOk && !probe.apiAccessOk) {
                    console.log(
                      "  → Grant Play Console API access to SA (pnpm export:play-api-setup)",
                    );
                  }
                }
              } catch {
                console.log("  play-api-probe: skipped (timeout)");
              }
            }
          }
        } catch {
          console.log("  iap-readiness: skipped (timeout)");
        }
        return;
      }
      console.log(`attempt ${i}: HTTP ${res.status}`);
    } catch (err) {
      console.log(`attempt ${i}: ${err.message ?? err}`);
    }
    if (i < maxAttempts) await wait(delayMs);
  }

  console.error(`✗ Render API not ready after ${maxAttempts} attempts`);
  process.exit(1);
}

await main();
