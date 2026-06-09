/**
 * Fetch production Render API metadata (cold-start tolerant, short timeout).
 */
const DEFAULT_BASE = "https://huhu-api.onrender.com";

export function renderApiBase() {
  return (process.env.RENDER_API_URL ?? DEFAULT_BASE).replace(/\/$/, "");
}

export async function fetchProdIapReadiness(base = renderApiBase()) {
  try {
    const res = await fetch(`${base}/v1/meta/iap-readiness`, {
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) return null;
    const body = await res.json();
    return body.readiness ?? body;
  } catch {
    return null;
  }
}

export async function fetchProdPlayApiProbe(base = renderApiBase()) {
  try {
    const res = await fetch(`${base}/v1/meta/play-api-probe`, {
      signal: AbortSignal.timeout(45_000),
    });
    if (!res.ok) return null;
    const body = await res.json();
    return body.probe ?? body;
  } catch {
    return null;
  }
}

export async function fetchProdPlayCatalogProbe(base = renderApiBase()) {
  try {
    const res = await fetch(`${base}/v1/meta/play-catalog-probe`, {
      signal: AbortSignal.timeout(45_000),
    });
    if (!res.ok) return null;
    const body = await res.json();
    return body.catalog ?? body;
  } catch {
    return null;
  }
}
