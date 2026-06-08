/**
 * Assemble a single launch handoff folder (docs + dist artifact manifest).
 * Usage: pnpm package:launch-bundle
 */
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { STORE_MARKETS } from "@huhu/shared";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "dist/launch-bundle");

function run(cmd, args) {
  const r = spawnSync(cmd, args, { cwd: root, shell: true, stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

function dirSizeBytes(path) {
  if (!existsSync(path)) return 0;
  let total = 0;
  for (const name of readdirSync(path)) {
    const p = join(path, name);
    const st = statSync(p);
    if (st.isDirectory()) total += dirSizeBytes(p);
    else total += st.size;
  }
  return total;
}

function artifactStatus(relPath) {
  const abs = join(root, relPath);
  if (!existsSync(abs)) return { path: relPath, present: false };
  const st = statSync(abs);
  return {
    path: relPath,
    present: true,
    bytes: st.isDirectory() ? dirSizeBytes(abs) : st.size,
  };
}

if (!existsSync(join(root, "dist/store-upload/tw/app-store/01-chat.png"))) {
  console.log("Store upload bundle missing — running package:store-upload…");
  run("pnpm", ["package:store-upload"]);
}

if (!existsSync(join(root, "dist/iap-store-checklist/README.md"))) {
  run("pnpm", ["export:iap-store-checklist"]);
}

if (!existsSync(join(root, "dist/android-release/com.ctrlz.huhu-release.aab"))) {
  if (existsSync(join(root, "apps/mobile/android/key.properties"))) {
    run("pnpm", ["build:android"]);
    run("pnpm", ["package:android-release"]);
  }
}

if (!existsSync(join(root, "dist/play-iap-products/README.md"))) {
  run("pnpm", ["export:play-iap-products"]);
}

if (!existsSync(join(root, "dist/app-store-connect/README.md"))) {
  run("pnpm", ["export:app-store-connect"]);
}

if (!existsSync(join(root, "dist/aso-brief/tw.md"))) {
  run("pnpm", ["export:aso-brief"]);
}

run("pnpm", ["build"]);
run("pnpm", ["export:operations-status"]);
run("pnpm", ["export:deploy-bundle"]);

mkdirSync(out, { recursive: true });

const docsToCopy = [
  "docs/LAUNCH.md",
  "docs/STORE_IAP.md",
  "docs/ASO_SCREENSHOTS.md",
  "docs/OFFERWALL.md",
  "docs/API_PUBLIC.md",
  "docs/BLOCKERS.md",
  "docs/DEPLOYMENT.md",
  "docs/PRODUCT_STATUS.md",
  "docs/SAFETY.md",
];
for (const rel of docsToCopy) {
  const src = join(root, rel);
  if (existsSync(src)) {
    cpSync(src, join(out, rel.replace("docs/", "")), { force: true });
  }
}

const asoBriefOut = join(out, "aso-brief");
mkdirSync(asoBriefOut, { recursive: true });
for (const { market } of STORE_MARKETS) {
  const src = join(root, "dist/aso-brief", `${market}.md`);
  if (existsSync(src)) cpSync(src, join(asoBriefOut, `${market}.md`));
}

if (existsSync(join(root, "dist/iap-store-checklist/README.md"))) {
  cpSync(join(root, "dist/iap-store-checklist"), join(out, "iap-store-checklist"), {
    recursive: true,
  });
}

const opsStatus = join(root, "dist/OPERATIONS_STATUS.md");
if (existsSync(opsStatus)) {
  cpSync(opsStatus, join(out, "OPERATIONS_STATUS.md"), { force: true });
}

const manifest = {
  generatedAt: new Date().toISOString(),
  bundleId: "com.ctrlz.huhu",
  docs: docsToCopy.filter((p) => existsSync(join(root, p))),
  artifacts: {
    storeUpload: artifactStatus("dist/store-upload"),
    asoBrief: artifactStatus("dist/aso-brief"),
    iapChecklist: artifactStatus("dist/iap-store-checklist"),
    operationsStatus: artifactStatus("dist/OPERATIONS_STATUS.md"),
    asoScreenshots: artifactStatus("dist/aso-screenshots"),
    asoScreenshotsCaptioned: artifactStatus("dist/aso-screenshots-captioned"),
    storeCatalog: artifactStatus("dist/store-catalog"),
    androidRelease: artifactStatus("dist/android-release/com.ctrlz.huhu-release.aab"),
    playIapProducts: artifactStatus("dist/play-iap-products"),
    appStoreConnect: artifactStatus("dist/app-store-connect"),
    iosRelease: artifactStatus("dist/ios-release/README.md"),
    deployBundle: artifactStatus("dist/deploy-bundle"),
  },
  markets: STORE_MARKETS.map(({ market, pricingRegion }) => ({
    market,
    pricingRegion,
    storeUpload: existsSync(join(root, "dist/store-upload", market)),
    asoBrief: existsSync(join(root, "dist/aso-brief", `${market}.md`)),
  })),
  nextSteps: [
    "pnpm check:launch",
    "Upload dist/store-upload/{market}/app-store-captioned and google-play-captioned",
    "Configure IAP per dist/iap-store-checklist",
    "Set production LLM and OFFERWALL_SECRET",
    "Deploy dist/deploy-bundle on cloud host; pnpm smoke:api:prod",
  ],
};

writeFileSync(join(out, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

const readme = `# Huhu launch bundle

Generated: ${manifest.generatedAt}

## Included

- LAUNCH.md, STORE_IAP.md, ASO docs, OFFERWALL, API_PUBLIC, BLOCKERS, DEPLOYMENT, PRODUCT_STATUS, SAFETY
- OPERATIONS_STATUS.md (IAP + artifact snapshot)
- aso-brief/ (per-market copy text)
- iap-store-checklist/ (when exported)
- manifest.json (paths to dist artifacts under repo root)

## Upload assets (not copied — large)

Prefer **captioned** folders under \`dist/store-upload/<market>/\`.

## Validate

\`\`\`bash
pnpm prelaunch
pnpm check:launch
pnpm validate:store-upload
\`\`\`
`;

writeFileSync(join(out, "README.md"), readme);
console.log(`Launch bundle written to ${out}`);

const val = spawnSync("pnpm", ["validate:launch-bundle"], {
  cwd: root,
  shell: true,
  stdio: "inherit",
});
if (val.status !== 0) process.exit(val.status ?? 1);
