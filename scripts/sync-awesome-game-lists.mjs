import fs from "node:fs/promises";
const sources=[{name:"bobeff/open-source-games",url:"https://raw.githubusercontent.com/bobeff/open-source-games/main/README.md"},{name:"michelpereira/awesome-open-source-games",url:"https://raw.githubusercontent.com/michelpereira/awesome-open-source-games/main/README.md"}];
const candidates=new Map();
for(const source of sources){
 const response=await fetch(source.url,{headers:{"user-agent":"GameVerse-Open-Game-Catalog/1.0"},signal:AbortSignal.timeout(60000)});
 if(!response.ok)throw new Error(source.name+" README failed: "+response.status);
 const readme=await response.text();let category="ألعاب مفتوحة المصدر";
 for(const line of readme.split(/\r?\n/)){
  const heading=line.match(/^#{2,5}\s+(.+)$/);if(heading)category=heading[1].replace(/[#*_]/g,"").trim().slice(0,100);
  if(!/^\s*[-*+]\s+/.test(line))continue;
  const urls=[...line.matchAll(/https?:\/\/github\.com\/([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)/g)].map(m=>"https://github.com/"+m[1].replace(/[.)]+$/,""));
  for(const url of urls){
   const slug=url.replace("https://github.com/","");if(["bobeff/open-source-games","michelpereira/awesome-open-source-games"].includes(slug))continue;
   const match=line.match(/\*\*([^*]+)\*\*/) || line.match(/\[([^\]]+)\]\(/);
   const title=match?match[1]:slug.split("/")[1].replace(/[-_]/g," ");
   candidates.set(slug,{id:"awesome-game-"+slug.toLowerCase().replace(/[^a-z0-9]+/g,"-"),title:title.trim().slice(0,180),category,kind:"game",platform:["متعدد / راجع المستودع"],description:"مرشح لعبة من قائمة ألعاب مفتوحة المصدر؛ تحقق من المستودع والإصدار والرخصة والأصول قبل النشر.",source:source.name,sourceUrl:url,downloadUrl:url,license:"راجع LICENSE في المستودع",verified:false,status:"awesome_list_candidate_repository_and_assets_review_required"});
  }
 }
 console.log(source.name+" processed");
}
const output={generatedAt:new Date().toISOString(),sources:sources.map(x=>x.name),total:candidates.size,notice:"Candidates extracted from curated lists. A listed source repository does not prove that every game or asset is distributable; check each repository, licence, assets and current releases.",items:[...candidates.values()].sort((a,b)=>a.title.localeCompare(b.title))};
if(!output.total)throw new Error("No repositories extracted from awesome lists");
await fs.mkdir("data",{recursive:true});await fs.writeFile("data/awesome-game-candidates.json",JSON.stringify(output,null,2)+"\n");
console.log("Wrote "+output.total+" unique game repository candidates");