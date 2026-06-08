/**
 * Chunk base64 PNG for ASC screenshot upload via sequential CDP evaluate.
 * Usage: node scripts/gen-screenshot-cdp-chunks.mjs <png-path>
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const pngPath = process.argv[2];
if (!pngPath) {
  console.error("Usage: node scripts/gen-screenshot-cdp-chunks.mjs <png>");
  process.exit(1);
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "dist/iap-review-screenshots/sc-upload");
mkdirSync(outDir, { recursive: true });

const name = basename(pngPath);
const b64 = readFileSync(pngPath).toString("base64");
const chunkSize = 28000;

writeFileSync(
  join(outDir, "00-reset.json"),
  JSON.stringify({
    expression: 'window.__scB64=""; "reset"',
    returnByValue: true,
  }),
);

let idx = 1;
for (let n = 0; n < b64.length; n += chunkSize, idx++) {
  const c = b64.slice(n, n + chunkSize);
  writeFileSync(
    join(outDir, `${String(idx).padStart(2, "0")}-chunk.json`),
    JSON.stringify({
      expression: `window.__scB64=(window.__scB64||'')+${JSON.stringify(c)}; window.__scB64.length`,
      returnByValue: true,
    }),
  );
}

const finalize = `(async()=>{const bin=atob(window.__scB64);const arr=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)arr[i]=bin.charCodeAt(i);const file=new File([arr],${JSON.stringify(name)},{type:'image/png'});const input=document.querySelector('input[type=file]');if(!input)return{err:'no input'};const dt=new DataTransfer();dt.items.add(file);const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'files')?.set;if(setter)setter.call(input,dt.files);input.dispatchEvent(new Event('change',{bubbles:true}));input.dispatchEvent(new Event('input',{bubbles:true}));return{len:input.files?.length,b64Len:window.__scB64?.length};})()`;

writeFileSync(
  join(outDir, "99-finalize.json"),
  JSON.stringify({ expression: finalize, awaitPromise: true, returnByValue: true }),
);

console.log(`wrote ${outDir} (${idx - 1} chunks, ${b64.length} b64 chars)`);
