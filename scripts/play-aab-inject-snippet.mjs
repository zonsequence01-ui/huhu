/**
 * Print browser CDP Runtime.evaluate snippet for Play Console AAB upload.
 * Prerequisite: pnpm serve:android-aab (default port 18888)
 * Usage: node scripts/play-aab-inject-snippet.mjs [port]
 */
const port = Number(process.argv[2]) || 18888;
const url = `http://127.0.0.1:${port}/com.ctrlz.huhu-release.aab`;

const expression = `(async()=>{const res=await fetch('${url}');if(!res.ok)return{err:'fetch failed',status:res.status};const buf=await res.arrayBuffer();const file=new File([buf],'com.ctrlz.huhu-release.aab',{type:'application/vnd.android.package-archive'});const input=[...document.querySelectorAll('input[type=file]')].find(i=>!i.files?.length)||document.querySelector('input[type=file]');if(!input)return{err:'no input'};const dt=new DataTransfer();dt.items.add(file);const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'files')?.set;if(setter)setter.call(input,dt.files);else input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}));input.dispatchEvent(new Event('input',{bubbles:true}));await new Promise(r=>setTimeout(r,8000));return{ok:true,size:file.size,files:input.files?.length,name:input.files?.[0]?.name};})()`;

console.log(`# Play AAB inject (Cursor browser CDP Runtime.evaluate)\n`);
console.log(`# 1. pnpm serve:android-aab ${port}`);
console.log(`# 2. Play Console → Closed testing Alpha → Create release → prepare page`);
console.log(`# 3. CDP evaluate (awaitPromise: true, returnByValue: true):\n`);
console.log(JSON.stringify({ expression, awaitPromise: true, returnByValue: true }, null, 2));
