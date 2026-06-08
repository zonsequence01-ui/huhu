/**
 * Chunked base64 upload to ASC IAP review screenshot input via CDP evaluate.
 * Run from repo root while Cursor browser is on the IAP page.
 */
import { readFileSync } from "node:fs";

const inputId = process.argv[2] ?? "iap_review_info_undefined";
const pngPath =
  process.argv[3] ??
  "dist/iap-review-screenshots/com.ctrlz.huhu.coins.small.png";
const fileName = pngPath.split(/[/\\]/).pop();

const b64 = readFileSync(pngPath).toString("base64");
const chunkSize = 8000;
const chunks = [];
for (let i = 0; i < b64.length; i += chunkSize) {
  chunks.push(b64.slice(i, i + chunkSize));
}

const init = `window.__iapB64=''; window.__iapChunks=${chunks.length};`;
const appends = chunks.map(
  (c, i) =>
    `window.__iapB64+=${JSON.stringify(c)}; void(${i});`,
);
const finalize = `(async()=>{const b64=window.__iapB64; const bin=atob(b64); const arr=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) arr[i]=bin.charCodeAt(i); const file=new File([arr],${JSON.stringify(fileName)},{type:'image/png'}); const input=document.getElementById(${JSON.stringify(inputId)}); if(!input) return {ok:false,err:'no input'}; const dt=new DataTransfer(); dt.items.add(file); input.files=dt.files; input.dispatchEvent(new Event('change',{bubbles:true})); input.dispatchEvent(new Event('input',{bubbles:true})); return {ok:true,len:input.files.length,name:input.files[0]?.name,size:input.files[0]?.size};})()`;

console.log(JSON.stringify({ init, appends, finalize, chunks: chunks.length, fileName }));
