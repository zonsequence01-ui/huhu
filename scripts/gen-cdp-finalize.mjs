import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "dist/iap-review-screenshots");
const finalize = `(async()=>{const b64=window.__iapB64||''; if(!b64) return {ok:false,err:'empty b64'}; const bin=atob(b64); const arr=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) arr[i]=bin.charCodeAt(i); const file=new File([arr],'com.ctrlz.huhu.coins.small.png',{type:'image/png'}); const input=document.getElementById('iap_review_info_undefined'); if(!input) return {ok:false,err:'no input'}; const dt=new DataTransfer(); dt.items.add(file); input.files=dt.files; input.dispatchEvent(new Event('change',{bubbles:true})); input.dispatchEvent(new Event('input',{bubbles:true})); return {ok:true, b64Len:b64.length, files:input.files.length, name:input.files[0]?.name, size:input.files[0]?.size};})()`;
writeFileSync(join(dir, "cdp-finalize.json"), JSON.stringify({ expression: finalize, awaitPromise: true, returnByValue: true }));
