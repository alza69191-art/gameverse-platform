const fs=await import("node:fs/promises");
const outputPath="data/fdroid-catalog.json";
const clean=value=>typeof value==="string"?value.replace(/<[^>]*>/g," ").replace(/&nbsp;/g," ").replace(/\s+/g," ").trim():"";
function normalize(app){
 const id=app.packageName||app.package_name;
 if(typeof id!=="string"||!id.includes("."))return null;
 const rawCategories=Array.isArray(app.categories)?app.categories:[app.category||"تطبيقات"];
 const category=rawCategories.find(x=>typeof x==="string")||"تطبيقات";
 const name=typeof app.name==="string"?app.name:id;
 const summary=clean(app.summary)||clean(app.description).slice(0,280);
 const isGame=rawCategories.some(x=>/game|لعب/i.test(String(x)));
 return {id:"fdroid-"+id,packageName:id,title:name,category,kind:isGame?"game":"app",platform:["Android"],description:summary.slice(0,280),source:"F-Droid official repository index",downloadUrl:"https://f-droid.org/packages/"+id+"/",license:app.license||"راجع صفحة المصدر",verified:false};
}
let apps=[];
const indexUrl="https://f-droid.org/repo/index-v1.json";
const response=await fetch(indexUrl,{headers:{"User-Agent":"GameVerse-Open-Catalog/1.0","Accept":"application/json"}});
if(response.ok){
 const index=await response.json();
 if(Array.isArray(index.apps))apps=index.apps.map(normalize).filter(Boolean);
}
if(!apps.length){
 console.warn("Full F-Droid index unavailable; falling back to public search API.");
 const queries=["game","games","arcade","puzzle","strategy","racing","chess","emulator","launcher","media","player","browser","maps","camera","editor","office","utility","security","education","ebook"];
 const found=new Map();
 const collect=value=>{
  if(Array.isArray(value)){for(const item of value)collect(item);return;}
  if(!value||typeof value!=="object")return;
  const item=normalize(value);if(item)found.set(item.packageName,item);
  for(const child of Object.values(value))if(child&&typeof child==="object")collect(child);
 };
 for(const query of queries){
  const result=await fetch("https://search.f-droid.org/api/search_apps?q="+encodeURIComponent(query),{headers:{"User-Agent":"GameVerse-Open-Catalog/1.0","Accept":"application/json"}});
  if(result.ok)collect(await result.json());else console.warn("F-Droid query skipped",query,result.status);
  await new Promise(resolve=>setTimeout(resolve,350));
 }
 apps=[...found.values()];
}
const unique=new Map(apps.map(app=>[app.packageName,app]));
const items=[...unique.values()].sort((a,b)=>a.title.localeCompare(b.title));
const output={generatedAt:new Date().toISOString(),source:"F-Droid official repository index",total:items.length,items,notice:"Discovery metadata only. Links lead to official F-Droid package pages. No APK binaries are mirrored. Verify signed indexes and signer fingerprints before any binary distribution."};
await fs.writeFile(outputPath,JSON.stringify(output,null,2)+"\n");
console.log("Indexed "+items.length+" F-Droid packages.");
