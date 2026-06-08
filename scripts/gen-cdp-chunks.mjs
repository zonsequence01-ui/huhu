import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "dist/iap-review-screenshots");
for (let i = 0; i < 11; i++) {
  const c = readFileSync(join(dir, `chunk-${i}.txt`), "utf8");
  const expression = `window.__iapB64=(window.__iapB64||'')+${JSON.stringify(c)}; window.__iapB64.length`;
  writeFileSync(join(dir, `cdp-chunk-${i}.json`), JSON.stringify({ expression }));
}
console.log("wrote 11 cdp chunk files");
