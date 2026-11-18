import fs from "node:fs/promises";
const feeds=["top-free","top-paid","top-grossing"].map(kind=>({kind,url:"https://rss.applemarketingtools.com/api/v2/us/apps/"+kind+"/200/apps.json"}));
const map=new Map();
for(const feed of feeds){
 const r=await fetch(feed.url,{headers:{"user-agent":"GameVerse-Catalog-Sync/1.0"},signal:AbortSignal.timeout(45000)});
 if(!r.ok)throw new Error("Apple RSS "+feed.kind+" failed: "+r.status);
 const data=await r.json();
 for(const x of data.feed?.results||[]){
  if(!x.id||!x.name||!x.url)continue;
  const id=String(x.id);
  map.set(id,{id:"apple-"+id,title:x.name,category:x.genres?.[0]?.name||"تطبيقات iOS",kind:"app",platform:["iOS"],description:String(x.artistName||"").slice(0,250),source:"Apple App Store RSS",sourceUrl:x.url,downloadUrl:x.url,license:"Proprietary — App Store terms apply",verified:false,status:"apple_store_listing_metadata_only_publisher_and_region_terms_apply",publisher:x.artistName||null,releaseDate:x.releaseDate||null});
 }
 console.log(feed.kind+": "+(data.feed?.results||[]).length);
}
const output={generatedAt:new Date().toISOString(),source:"Apple Marketing Tools RSS feeds",total:map.size,notice:"App Store metadata only; rankings and availability vary by country and time. Apps are proprietary unless their publishers explicitly provide a separate open-source licence. GameVerse links to official App Store pages and does not redistribute binaries.",items:[...map.values()]};
if(!output.total)throw new Error("Apple RSS returned no apps; refusing to overwrite");
await fs.mkdir("data",{recursive:true});await fs.writeFile("data/apple-app-catalog.json",JSON.stringify(output,null,2)+"\n");
console.log("Imported "+output.total+" unique App Store listings");