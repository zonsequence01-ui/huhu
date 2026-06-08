/**
 * Write dist/OPERATIONS_STATUS.md for release/ops handoff.
 * Usage: pnpm export:operations-status
 */
import { writeFileSync, existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import dns from "node:dns/promises";
import {
  getUsdBaseline,
  STORE_PRIVACY_URL,
  STORE_PUBLIC_SITE_URL,
  STORE_SUPPORT_URL,
  SUBSCRIPTION_PRICES_USD,
} from "@huhu/shared";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "dist/OPERATIONS_STATUS.md");

let iap = { productionReady: false, strict: false };
try {
  const mod = await import(
    pathToFileURL(join(root, "apps/api/dist/services/iap-readiness.js")).href
  );
  iap = mod.getIapReadiness();
} catch {
  /* build first */
}

const usd = getUsdBaseline();
const launchManifest = existsSync(join(root, "dist/launch-bundle/manifest.json"))
  ? JSON.parse(
      readFileSync(join(root, "dist/launch-bundle/manifest.json"), "utf8"),
    )
  : null;

const deployManifest = existsSync(join(root, "dist/deploy-bundle/manifest.json"))
  ? JSON.parse(
      readFileSync(join(root, "dist/deploy-bundle/manifest.json"), "utf8"),
    )
  : null;

const siteBase = STORE_PUBLIC_SITE_URL.replace(/\/$/, "");
const siteHost = new URL(siteBase).hostname;

let dnsStatus = "unknown";
try {
  const records = await dns.lookup(siteHost, { all: true });
  dnsStatus = records.map((r) => r.address).join(", ");
} catch {
  dnsStatus = "NXDOMAIN / no A record";
}

async function fetchStatus(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(12_000) });
    return res.ok ? "200" : `HTTP ${res.status}`;
  } catch {
    return "unreachable";
  }
}

const [privacyStatus, supportStatus, healthStatus, renderHealth] = await Promise.all([
  fetchStatus(STORE_PRIVACY_URL),
  fetchStatus(STORE_SUPPORT_URL),
  fetchStatus(`${siteBase}/health`),
  (async () => {
    try {
      const res = await fetch("https://huhu-api.onrender.com/health", {
        signal: AbortSignal.timeout(30_000),
      });
      if (!res.ok) return `HTTP ${res.status}`;
      const body = await res.json();
      return `database=${body.database ?? "?"} vectorStore=${body.vectorStore ?? "?"}`;
    } catch {
      return "unreachable";
    }
  })(),
]);
const prodSite = healthStatus === "200" ? "up" : healthStatus;

const lines = [
  "# Huhu operations status",
  "",
  `Generated: ${new Date().toISOString()}`,
  "",
  "## Production site",
  "",
  `- URL: ${STORE_PUBLIC_SITE_URL}`,
  `- DNS \`${siteHost}\`: **${dnsStatus}**`,
  `- privacy: **${privacyStatus}** (${STORE_PRIVACY_URL})`,
  `- support: **${supportStatus}**`,
  `- /health: **${prodSite}**`,
  `- Render API: **${renderHealth}** (\`pnpm check:render\`)`,
  `- check: \`pnpm check:site\` (blocks Play/ASC until privacy 200)`,
  `- verify: \`pnpm smoke:api:prod\` (uses PROD_SMOKE_URL to override)`,
  `- deploy: \`pnpm export:deploy-bundle\` → \`deploy-remote-static.example.sh\` (Phase 1)`,
  "",
  "## Deploy bundle",
  "",
  deployManifest
    ? [
        `- path: \`dist/deploy-bundle/\``,
        `- generated: ${deployManifest.generatedAt}`,
        `- remote script: \`deploy-remote.example.sh\` (rsync + docker compose)`,
        `- validate: \`pnpm validate:deploy-bundle\``,
      ].join("\n")
    : "- run `pnpm export:deploy-bundle`",
  "",
  "## Android release",
  "",
  existsSync(join(root, "dist/android-release/build-meta.json"))
    ? (() => {
        const meta = JSON.parse(
          readFileSync(join(root, "dist/android-release/build-meta.json"), "utf8"),
        );
        return [
          `- AAB: \`dist/android-release/com.ctrlz.huhu-release.aab\` (${(meta.aabBytes / (1024 * 1024)).toFixed(1)} MB)`,
          `- apiBase: **${meta.apiBase}**`,
          `- built: ${meta.generatedAt}`,
          `- validate: \`pnpm validate:android-release\``,
        ].join("\n");
      })()
    : "- run `pnpm ship:android`",
  "",
  "## IAP readiness",
  "",
  `- productionReady: **${iap.productionReady}**`,
  `- IAP_STRICT: ${iap.strict}`,
  `- iOS configured: ${iap.ios?.configured ?? false}`,
  `- Android playApi: ${iap.android?.playApi ?? false}`,
  "",
  "## Blueprint pricing (US baseline)",
  "",
  `- Lite $${SUBSCRIPTION_PRICES_USD.lite} / Basic $${SUBSCRIPTION_PRICES_USD.basic} / Premium $${SUBSCRIPTION_PRICES_USD.premium}`,
  `- Catalog USD: Lite $${usd.lite} / Basic $${usd.basic} / Premium $${usd.premium}`,
  "",
  "## Launch artifacts",
  "",
  launchManifest
    ? `- launch-bundle manifest: ${launchManifest.generatedAt}`
    : "- launch-bundle: run `pnpm package:launch-bundle`",
  existsSync(join(root, "dist/store-upload/tw/app-store-captioned/01-chat.png"))
    ? "- store-upload: present"
    : "- store-upload: run `pnpm package:store-upload`",
  "",
  "## Repo commands",
  "",
  "```bash",
  "pnpm verify",
  "pnpm prelaunch   # verify + E2E (full release gate)",
  "pnpm check:launch",
  "pnpm check:iap",
  "pnpm smoke:api:local",
  "pnpm smoke:api   # SMOKE_BASE_URL against running API",
  "pnpm smoke:api:prod",
  "pnpm check:site",
  "pnpm check:render",
  "pnpm verify:docker",
  "pnpm ship:android",
  "pnpm export:deploy-bundle",
  "```",
  "",
];

writeFileSync(out, `${lines.join("\n")}\n`);
console.log(`Wrote ${out}`);

const { spawnSync } = await import("node:child_process");
const val = spawnSync("pnpm", ["validate:operations-status"], {
  cwd: root,
  shell: true,
  stdio: "inherit",
});
if (val.status !== 0) process.exit(val.status ?? 1);
