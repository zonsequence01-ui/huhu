/**
 * Generate Runtime.evaluate expression to upload one PNG via DataTransfer.
 * Usage: node scripts/gen-screenshot-upload-expr.mjs <png-path> [output-json]
 */
import { readFileSync, writeFileSync } from "node:fs";

const pngPath = process.argv[2];
if (!pngPath) {
  console.error("Usage: node scripts/gen-screenshot-upload-expr.mjs <png>");
  process.exit(1);
}

const name = pngPath.replace(/\\/g, "/").split("/").pop();
const b64 = readFileSync(pngPath).toString("base64");
const expression = `(async()=>{const b64='${b64}';const bin=atob(b64);const arr=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)arr[i]=bin.charCodeAt(i);const file=new File([arr],'${name}',{type:'image/png'});const input=document.querySelector('input[type=file]');if(!input)return{err:'no input'};const dt=new DataTransfer();dt.items.add(file);const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'files')?.set;if(setter)setter.call(input,dt.files);else input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}));input.dispatchEvent(new Event('input',{bubbles:true}));return{ok:true,len:input.files?.length,name:input.files?.[0]?.name};})()`;

const payload = { expression, awaitPromise: true, returnByValue: true };
const out = process.argv[3] ?? "dist/iap-review-screenshots/_upload-one.json";
writeFileSync(out, JSON.stringify(payload));
console.log(`wrote ${out} (${expression.length} chars)`);
