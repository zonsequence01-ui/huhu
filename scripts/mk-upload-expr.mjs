import { readFileSync, writeFileSync } from "node:fs";
const b64 = readFileSync(
  "dist/iap-review-screenshots/com.ctrlz.huhu.coins.small.png",
).toString("base64");
const expr = `(async()=>{const b64=${JSON.stringify(b64)}; const bin=atob(b64); const arr=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) arr[i]=bin.charCodeAt(i); const file=new File([arr],'com.ctrlz.huhu.coins.small.png',{type:'image/png'}); const input=document.getElementById('iap_review_info_undefined'); const dt=new DataTransfer(); dt.items.add(file); input.files=dt.files; input.dispatchEvent(new Event('change',{bubbles:true})); return {ok:true, n:input.files.length, name:input.files[0]?.name};})()`;
console.log("exprLen", expr.length);
writeFileSync("dist/iap-review-screenshots/upload-expr.json", JSON.stringify({ expression: expr }));
