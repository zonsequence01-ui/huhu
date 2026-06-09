/**
 * Pre-launch readiness report: ASO listings, store catalog PPP, IAP credentials.
 * Usage: pnpm check:launch
 * Exit 0 when listing/catalog validation pass; IAP may still be incomplete (reported).
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  STORE_MARKETS,
  getPricing,
  SUBSCRIPTION_PRICES_USD,
} from "@huhu/shared";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function run(cmd, args) {
  const r = spawnSync(cmd, args, {
    cwd: root,
    shell: true,
    encoding: "utf8",
  });
  return { ok: r.status === 0, out: (r.stdout ?? "") + (r.stderr ?? "") };
}

let failed = false;

console.log("=== Huhu launch readiness ===\n");

const listings = run("pnpm", ["validate:store-listings"]);
console.log(listings.ok ? "✓ store listings" : "✗ store listings");
if (!listings.ok) {
  console.log(listings.out);
  failed = true;
}

const publicPages = run("pnpm", ["validate:public-pages"]);
console.log(publicPages.ok ? "✓ public support/privacy pages" : "✗ public pages");
if (!publicPages.ok) {
  console.log(publicPages.out);
  failed = true;
}

const catalog = run("pnpm", ["validate:store-catalog"]);
console.log(catalog.ok ? "✓ store catalog (PPP + SKU)" : "✗ store catalog");
if (!catalog.ok) {
  console.log(catalog.out);
  failed = true;
}

const asoBrief = run("pnpm", ["export:aso-brief"]);
console.log(asoBrief.ok ? "✓ export aso-brief" : "✗ export aso-brief");
if (!asoBrief.ok) {
  console.log(asoBrief.out);
  failed = true;
} else {
  const briefDir = join(root, "dist/aso-brief");
  for (const { market } of STORE_MARKETS) {
    const path = join(briefDir, `${market}.md`);
    if (!existsSync(path)) {
      console.error(`✗ missing ${path}`);
      failed = true;
    }
  }
  if (!failed) console.log("✓ dist/aso-brief (6 markets)");
}

console.log("\n--- PPP baseline (US) ---");
const us = getPricing("US");
console.log(
  `Lite ${us.lite} / Basic ${us.basic} / Premium ${us.premium} ${us.currency}`,
);
console.log(
  `Blueprint USD: ${SUBSCRIPTION_PRICES_USD.lite} / ${SUBSCRIPTION_PRICES_USD.basic} / ${SUBSCRIPTION_PRICES_USD.premium}`,
);
if (
  us.lite !== SUBSCRIPTION_PRICES_USD.lite ||
  us.basic !== SUBSCRIPTION_PRICES_USD.basic ||
  us.premium !== SUBSCRIPTION_PRICES_USD.premium
) {
  console.error("✗ US pricing drift from SUBSCRIPTION_PRICES_USD");
  failed = true;
}

console.log("\n--- ASO markets ---");
for (const { market, pricingRegion } of STORE_MARKETS) {
  const p = getPricing(pricingRegion);
  console.log(
    `${market}: ${p.lite} ${p.currency} (region ${pricingRegion})`,
  );
}

let iapReady = false;
try {
  const mod = await import(
    new URL("../apps/api/dist/services/iap-readiness.js", import.meta.url).href
  );
  const r = mod.getIapReadiness();
  iapReady = r.productionReady;
  console.log("\n--- IAP ---");
  console.log(`productionReady: ${r.productionReady}`);
  console.log(
    `androidProductionReady: ${r.androidProductionReady ?? false} / iosProductionReady: ${r.iosProductionReady ?? false}`,
  );
  console.log(
    `iOS: ${r.ios.configured} (legacy=${r.ios.legacyReceipt}, jws=${r.ios.appStoreJws})`,
  );
  console.log(
    `Android playApi: ${r.android.playApi} package: ${r.android.packageName ?? "—"}`,
  );
  if (!r.productionReady) {
    console.log(
      "  → Set IAP_STRICT + store credentials; see docs/STORE_IAP.md",
    );
  }
} catch {
  console.log("\n--- IAP ---");
  console.log("  (run `pnpm build` first for iap-readiness details)");
}

const REQUIRED_SHOTS = [
  "01-chat.png",
  "02-modes.png",
  "03-character-creator.png",
  "04-diary.png",
  "05-subscribe.png",
  "06-privacy.png",
];
console.log("\n--- ASO screenshots ---");
let asoMarketsReady = 0;
for (const { market } of STORE_MARKETS) {
  const dir = join(root, "dist/aso-screenshots", market);
  const missing = REQUIRED_SHOTS.filter((f) => !existsSync(join(dir, f)));
  if (missing.length === 0) {
    asoMarketsReady += 1;
    console.log(`✓ ${market} (6/6 PNG in dist/aso-screenshots/${market}/)`);
  } else {
    console.log(
      `○ ${market} (${6 - missing.length}/6) — run pnpm capture:aso-screenshots -- --market=${market}`,
    );
  }
}
if (asoMarketsReady === STORE_MARKETS.length) {
  const shots = run("pnpm", ["validate:aso-screenshots", "--", "--all"]);
  console.log(shots.ok ? "✓ validate:aso-screenshots --all" : "✗ screenshot size check failed");
  if (!shots.ok) {
    console.log(shots.out);
    failed = true;
  }
  let playReady = 0;
  for (const { market } of STORE_MARKETS) {
    const dir = join(root, "dist/aso-screenshots-play", market);
    const missing = REQUIRED_SHOTS.filter((f) => !existsSync(join(dir, f)));
    if (missing.length === 0) playReady += 1;
  }
  if (playReady === STORE_MARKETS.length) {
    const play = run("pnpm", ["validate:aso-play-screenshots", "--", "--all"]);
    console.log(
      play.ok ? "✓ validate:aso-play-screenshots --all (1080×1920)" : "✗ Play screenshot check failed",
    );
    if (!play.ok) {
      console.log(play.out);
      failed = true;
    }
  } else {
    console.log(
      `○ Google Play PNG (${playReady}/${STORE_MARKETS.length}) — pnpm resize:aso-play-screenshots -- --all`,
    );
  }
  let captionedReady = 0;
  for (const { market } of STORE_MARKETS) {
    const cap = join(root, "dist/aso-screenshots-captioned", market, "01-chat.png");
    if (existsSync(cap)) captionedReady += 1;
  }
  if (captionedReady === STORE_MARKETS.length) {
    const capVal = run("pnpm", ["validate:aso-captioned:all"]);
    console.log(
      capVal.ok
        ? `✓ ASO captioned PNG (${captionedReady}/${STORE_MARKETS.length} markets)`
        : "✗ validate:aso-captioned:all failed",
    );
    if (!capVal.ok) {
      console.log(capVal.out);
      failed = true;
    }
  } else if (asoMarketsReady === STORE_MARKETS.length) {
    console.log(
      `○ ASO captioned (${captionedReady}/${STORE_MARKETS.length}) — pnpm compose:aso-screenshots -- --all`,
    );
  }
  const storeUploadReady = STORE_MARKETS.every(({ market }) =>
    existsSync(join(root, "dist/store-upload", market, "app-store", "01-chat.png")),
  );
  if (!storeUploadReady && asoMarketsReady === STORE_MARKETS.length) {
    const pkgUpload = run("pnpm", ["package:store-upload"]);
    console.log(
      pkgUpload.ok ? "✓ package:store-upload" : "✗ package:store-upload failed",
    );
    if (!pkgUpload.ok) {
      console.log(pkgUpload.out);
      failed = true;
    }
  }
  if (
    STORE_MARKETS.every(({ market }) =>
      existsSync(join(root, "dist/store-upload", market, "app-store", "01-chat.png")),
    )
  ) {
    const upload = run("pnpm", ["validate:store-upload"]);
    console.log(
      upload.ok ? "✓ validate:store-upload" : "✗ store-upload bundle validation failed",
    );
    if (!upload.ok) {
      console.log(upload.out);
      failed = true;
    }
  } else if (asoMarketsReady === STORE_MARKETS.length) {
    console.log("○ store-upload — pnpm package:store-upload");
  }
}

const androidAab = join(root, "dist/android-release/com.ctrlz.huhu-release.aab");
if (existsSync(androidAab)) {
  const ar = run("pnpm", ["validate:android-release"]);
  console.log(ar.ok ? "✓ validate:android-release" : "✗ android release AAB");
  if (!ar.ok) console.log(ar.out);
} else {
  console.log("○ android-release — pnpm build:android && pnpm package:android-release");
}

const ascReadme = join(root, "dist/app-store-connect/README.md");
if (existsSync(ascReadme)) {
  console.log("✓ dist/app-store-connect");
} else {
  const asc = run("pnpm", ["export:app-store-connect"]);
  console.log(asc.ok ? "✓ export:app-store-connect" : "✗ export:app-store-connect");
  if (!asc.ok) {
    console.log(asc.out);
    failed = true;
  }
}

const iosCfg = run("pnpm", ["validate:ios-config"]);
console.log(iosCfg.ok ? "✓ validate:ios-config" : "✗ validate:ios-config");
if (!iosCfg.ok) {
  console.log(iosCfg.out);
  failed = true;
}

const playIapReadme = join(root, "dist/play-iap-products/README.md");
if (existsSync(playIapReadme)) {
  console.log("✓ dist/play-iap-products");
} else {
  const exp = run("pnpm", ["export:play-iap-products"]);
  console.log(exp.ok ? "✓ export:play-iap-products" : "✗ export:play-iap-products");
  if (!exp.ok) {
    console.log(exp.out);
    failed = true;
  }
}

const iapListDir = join(root, "dist/iap-store-checklist");
if (existsSync(join(iapListDir, "README.md"))) {
  const iapVal = run("pnpm", ["validate:iap-store-checklist"]);
  console.log(
    iapVal.ok ? "✓ validate:iap-store-checklist" : "✗ IAP checklist validation failed",
  );
  if (!iapVal.ok) {
    console.log(iapVal.out);
    failed = true;
  }
} else {
  console.log("○ IAP checklist — pnpm export:iap-store-checklist");
}

const deployBundleDir = join(root, "dist/deploy-bundle");
if (!existsSync(join(deployBundleDir, "DEPLOY.md"))) {
  const dep = run("pnpm", ["export:deploy-bundle"]);
  console.log(dep.ok ? "✓ export:deploy-bundle" : "✗ export:deploy-bundle failed");
  if (!dep.ok) {
    console.log(dep.out);
    failed = true;
  }
}
if (existsSync(join(deployBundleDir, "DEPLOY.md"))) {
  const depVal = run("pnpm", ["validate:deploy-bundle"]);
  console.log(
    depVal.ok ? "✓ validate:deploy-bundle" : "✗ deploy-bundle validation failed",
  );
  if (!depVal.ok) {
    console.log(depVal.out);
    failed = true;
  }
}

const launchBundleDir = join(root, "dist/launch-bundle");
const canPackageLaunchBundle =
  asoMarketsReady === STORE_MARKETS.length ||
  STORE_MARKETS.every(({ market }) =>
    existsSync(join(root, "dist/store-upload", market, "app-store", "01-chat.png")),
  );
if (!existsSync(join(launchBundleDir, "manifest.json"))) {
  if (canPackageLaunchBundle) {
    const pkg = run("pnpm", ["package:launch-bundle"]);
    console.log(
      pkg.ok ? "✓ package:launch-bundle" : "✗ package:launch-bundle failed",
    );
    if (!pkg.ok) {
      console.log(pkg.out);
      failed = true;
    }
  } else {
    console.log(
      "○ launch-bundle — requires ASO screenshots (pnpm capture:aso-screenshots -- --all)",
    );
  }
}
if (existsSync(join(launchBundleDir, "manifest.json"))) {
  const bundleLaunch = join(launchBundleDir, "LAUNCH.md");
  if (
    existsSync(bundleLaunch) &&
    !readFileSync(bundleLaunch, "utf8").includes("pnpm prelaunch")
  ) {
    console.log("○ launch-bundle docs stale — pnpm package:launch-bundle");
  }
  const lb = run("pnpm", ["validate:launch-bundle"]);
  console.log(
    lb.ok ? "✓ validate:launch-bundle" : "✗ launch-bundle validation failed",
  );
  if (!lb.ok) {
    console.log(lb.out);
    failed = true;
  }
} else {
  console.log("○ launch-bundle — pnpm package:launch-bundle");
}

const opsStatusPath = join(root, "dist/OPERATIONS_STATUS.md");
if (existsSync(join(root, "apps/api/dist/services/iap-readiness.js"))) {
  if (!existsSync(opsStatusPath)) {
    const ops = run("pnpm", ["export:operations-status"]);
    if (!ops.ok) {
      console.log("✗ export:operations-status");
      console.log(ops.out);
      failed = true;
    }
  }
  console.log(
    existsSync(opsStatusPath)
      ? "✓ dist/OPERATIONS_STATUS.md"
      : "✗ OPERATIONS_STATUS.md missing",
  );
} else {
  console.log("○ operations status — pnpm build && pnpm export:operations-status");
}

if (existsSync(opsStatusPath)) {
  const opsVal = run("pnpm", ["validate:operations-status"]);
  console.log(
    opsVal.ok ? "✓ validate:operations-status" : "✗ OPERATIONS_STATUS validation failed",
  );
  if (!opsVal.ok) {
    console.log(opsVal.out);
    failed = true;
  }
}

if (process.env.SKIP_SMOKE !== "1" && existsSync(join(root, "apps/api/dist/app.js"))) {
  const smoke = run("pnpm", ["smoke:api:local"]);
  console.log(smoke.ok ? "✓ smoke:api:local" : "✗ smoke:api:local failed");
  if (!smoke.ok) {
    console.log(smoke.out);
    failed = true;
  }
} else if (process.env.SKIP_SMOKE === "1") {
  console.log("○ smoke:api:local (SKIP_SMOKE=1)");
}

if (process.env.CHECK_PROD_SMOKE === "1") {
  const prod = run("pnpm", ["check:site"]);
  console.log(prod.ok ? "✓ check:site (privacy/support)" : "✗ check:site failed");
  if (!prod.ok) {
    console.log(prod.out);
    failed = true;
  }
  const smoke = run("pnpm", ["smoke:api:prod"]);
  console.log(smoke.ok ? "✓ smoke:api:prod" : "✗ smoke:api:prod failed");
  if (!smoke.ok) {
    console.log(smoke.out);
    failed = true;
  }
} else {
  const site = run("pnpm", ["check:site"]);
  if (site.ok) {
    console.log("✓ check:site (privacy/support live)");
  } else {
    console.log(
      "○ production site — privacy URL not live (blocks Play/ASC submit)",
    );
    console.log(
      "  → DNS A record `huhu` + Phase 1: bash dist/deploy-bundle/deploy-remote-static.example.sh",
    );
  }
}

console.log("\n--- Manual (not automatable in repo) ---");
console.log("- App Store / Play SKU + sandbox IAP");
if (asoMarketsReady < STORE_MARKETS.length) {
  console.log("- Screenshot PNG: pnpm capture:aso-screenshots -- --all");
} else if (!existsSync(join(root, "dist/store-upload/tw/google-play/01-chat.png"))) {
  console.log("- Package upload: pnpm package:store-upload");
} else {
  console.log("- Upload dist/store-upload/* to store consoles");
}
console.log("- Production LLM (LLAMA_BASE_URL or cloud API keys)");
console.log("- Offerwall SDK partner");

if (failed) {
  console.error("\nLaunch validation FAILED (fix listings/catalog above).");
  process.exit(1);
}

console.log(
  `\nLaunch validation OK (codebase). IAP production: ${iapReady ? "ready" : "pending credentials"}.`,
);
process.exit(0);
