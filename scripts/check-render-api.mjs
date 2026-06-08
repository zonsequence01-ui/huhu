/**
 * Verify Render production API (cold-start tolerant).
 * Usage: pnpm check:render
 * Env: RENDER_API_URL (default https://huhu-api.onrender.com)
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
      console.log(`✓ /health OK (attempt ${i}, database=${body.database})`);
      process.exit(0);
    }
    console.log(`attempt ${i}: HTTP ${res.status}`);
  } catch (err) {
    console.log(`attempt ${i}: ${err.message ?? err}`);
  }
  if (i < maxAttempts) await wait(delayMs);
}

console.error(`✗ Render API not ready after ${maxAttempts} attempts`);
process.exit(1);
