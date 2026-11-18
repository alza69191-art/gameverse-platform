const queries = ["game","games","arcade","puzzle","strategy","racing","chess","emulator","launcher","media","player","browser","maps","camera","editor","office","utility","security","education","ebook"];
const endpoint = "https://search.f-droid.org/api/search_apps?q=";
const found = new Map();
function collect(value){
 if(Array.isArray(value)){for(const item of value)collect(item);return;}
 if(!value||typeof value!=="object")return;
 const id=value.packageName||value.package_name||value.packageId||value.id;
 if(typeof id==="string"&&id.includes(".")){
  const name=value.name||value.title||value.localizedName||id;
  const summary=value.summary||value.description||"";
  found.set(id,{id:"fdroid-"+id,packageName:id,title:typeof name==="string"?name:id,category:Array.isArray(value.categories)?value.categories[0]:"تطبيقات",kind:"app",platform:["Android"],description:typeof summary==="string"?summary.replace(/<[^>]*>/g," ").slice(0,280):"",source:"F-Droid",downloadUrl:"https://f-droid.org/packages/"+id+"/",license:value.license||"راجع صفحة المصدر",verified:true});
 }
 for(const [key,item] of Object.entries(value)){if(["apps","results","items","packages","data"].includes(key))collect(item);}
}
for(const query of queries){
 const response=await fetch(endpoint+encodeURIComponent(query),{headers:{"User-Agent":"GameVerse-Open-Catalog/1.0","Accept":"application/json"}});
 if(!response.ok){console.warn("F-Droid search skipped",query,response.status);continue;}
 const data=await response.json();collect(data);
}
const items=[...found.values()];
const output={generatedAt:new Date().toISOString(),source:"F-Droid public search API",total:items.length,items,notice:"Discovery index only; links point to official F-Droid app pages. F-Droid's signed repository index must be verified before any binary mirroring."};
await (await import("node:fs/promises")).writeFile("data/fdroid-catalog.json",JSON.stringify(output,null,2)+"\n");
console.log("Indexed "+items.length+" F-Droid apps.");
