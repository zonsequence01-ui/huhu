/**
 * Document iOS release artifact layout (IPA built on macOS only).
 * Usage: pnpm package:ios-release
 */
import { copyFileSync, existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ipaSrc = join(root, "apps/mobile/build/ios/ipa/huhu.ipa");
const outDir = join(root, "dist/ios-release");
const ipaDest = join(outDir, "com.ctrlz.huhu-release.ipa");

mkdirSync(outDir, { recursive: true });

let sizeNote = "not built yet";
if (existsSync(ipaSrc)) {
  copyFileSync(ipaSrc, ipaDest);
  sizeNote = `${(statSync(ipaDest).size / (1024 * 1024)).toFixed(1)} MB`;
}

writeFileSync(
  join(outDir, "README.md"),
  `# iOS release (App Store / TestFlight)

- Bundle: \`com.ctrlz.huhu\`
- IPA: \`com.ctrlz.huhu-release.ipa\` (${sizeNote})

## Build (macOS + Xcode)

\`\`\`bash
cd apps/mobile
flutter build ipa --release
pnpm package:ios-release
\`\`\`

## App Store Connect

1. **TestFlight** or **Distribution → iOS App Version 1.0** — upload IPA via Transporter or Xcode.
2. Metadata: \`dist/app-store-connect/tw.json\` (and other locales).
3. Screenshots: \`dist/store-upload/tw/app-store/\` or captioned variants.
4. IAP: \`dist/app-store-connect/iap-products.json\` + \`docs/STORE_IAP.md\`.

## Windows

Flutter iOS release builds require macOS. Use \`pnpm validate:ios-config\` to verify bundle ID on any OS.
`,
);

console.log(`✓ ${join(outDir, "README.md")}`);
if (existsSync(ipaDest)) {
  console.log(`✓ ${ipaDest} (${sizeNote})`);
} else {
  console.log("○ IPA not found — build on macOS with flutter build ipa --release");
}
