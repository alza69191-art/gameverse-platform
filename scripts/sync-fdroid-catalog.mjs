const queries=["game","games","arcade","puzzle","strategy","racing","chess","emulator","launcher","media","player","browser","maps","camera","editor","office","utility","security","education","ebook"];
const endpoint="https://search.f-droid.org/api/search_apps?q=";
const found=new Map();
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function collect(value){
 if(Array.isArray(value)){for(const item of value)collect(item);return;}
 if(!value||typeof value!=="object")return;
 const id=value.packageName||value.package_name||value.packageId||value.package_id;
 if(typeof id==="string"&&id.includes(".")){
  const name=value.name||value.title||value.localizedName||id;
  const summary=value.summary||value.description||"";
  const cats=value.categories||value.category||[];
  found.set(id,{id:"fdroid-"+id,packageName:id,title:typeof name==="string"?name:id,category:Array.isArray(cats)?(cats[0]||"تطبيقات"):String(cats||"تطبيقات"),kind:"app",platform:["Android"],description:typeof summary==="string"?summary.replace(/<[^>]*>/g," ").replace(/\\s+/g," ").slice(0,280):"",source:"F-Droid",downloadUrl:"https://f-droid.org/packages/"+id+"/",license:value.license||"راجع صفحة المصدر",verified:true});
 }
 for(const item of Object.values(value))if(item&&typeof item==="object")collect(item);
}
for(const query of queries){
 const response=await fetch(endpoint+encodeURIComponent(query),{headers:{"User-Agent":"GameVerse-Open-Catalog/1.0","Accept":"application/json"}});
 if(response.ok){collect(await response.json());}else{console.warn("F-Droid search skipped",query,response.status);}
 await sleep(350);
}
const items=[...found.values()].sort((a,b)=>a.title.localeCompare(b.title));
const output={generatedAt:new Date().toISOString(),source:"F-Droid public search API",total:items.length,items,notice:"Discovery index only. Links point to official F-Droid app pages. Do not mirror binaries without verifying the signed repository index and redistribution terms."};
await (await import("node:fs/promises")).writeFile("data/fdroid-catalog.json",JSON.stringify(output,null,2)+"\n");
console.log("Indexed "+items.length+" F-Droid apps.");
