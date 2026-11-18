import fs from "node:fs/promises";

const headers={"accept":"application/vnd.github+json","user-agent":"GameVerse-Open-Game-Catalog/1.0"};
const api="https://api.github.com/repos/Trilarion/opensourcegames/git/trees/master?recursive=1";
const treeResponse=await fetch(api,{headers,signal:AbortSignal.timeout(60000)});
if(!treeResponse.ok)throw new Error("OSGL GitHub tree failed: "+treeResponse.status);
const tree=await treeResponse.json();
if(!Array.isArray(tree.tree))throw new Error("OSGL tree response missing tree");
const paths=tree.tree.filter(x=>x.type==="blob"&&/^entries\/.*\.md$/i.test(x.path));
const limit=Math.max(100,Math.min(5000,Number(process.env.OSGL_MAX_ENTRIES||3000)));
const selected=paths.slice(0,limit);
let cursor=0,done=0,failed=0;
const items=[];
function field(text,name){
 const line=text.match(new RegExp("^- "+name+":\\s*(.+)$","im"));
 return line?line[1].trim():"";
}
function urls(value){return [...value.matchAll(/https?:\/\/[^\s,()]+/g)].map(m=>m[0].replace(/[.)]+$/,""));}
async function worker(){
 while(true){
  const i=cursor++;if(i>=selected.length)return;
  const file=selected[i];
  try{
   const r=await fetch("https://raw.githubusercontent.com/Trilarion/opensourcegames/master/"+file.path,{headers:{"user-agent":headers["user-agent"]},signal:AbortSignal.timeout(20000)});
   if(!r.ok)throw new Error("HTTP "+r.status);
   const text=await r.text();
   const title=(text.match(/^#\s+(.+)$/m)||[])[1]?.trim();
   if(!title){failed++;continue}
   const home=urls(field(text,"Home"))[0]||"";
   const download=urls(field(text,"Download"))[0]||urls(field(text,"Play"))[0]||"";
   const play=urls(field(text,"Play"))[0]||"";
   const repos=urls(field(text,"Code repository"));
   const platform=field(text,"Platform").split(",").map(x=>x.trim()).filter(Boolean);
   const license=field(text,"Code license")||"Not specified";
   const assets=field(text,"Assets license")||"Not specified";
   const summary=(text.split(/\n\s*##\s+/)[0]||"").replace(/^#[^\n]+\n/,"").replace(/\n+/g," ").trim().slice(0,700);
   const sourceUrl=repos[0]||home||download||play||"https://github.com/Trilarion/opensourcegames/tree/master/"+file.path;
   const safeUrl=x=>/^https?:\/\//i.test(x);
   items.push({id:"osgl-"+file.path.split("/").pop().replace(/\.md$/i,""),title,category:field(text,"Keyword").split(",")[0]?.trim()||"ألعاب مفتوحة المصدر",kind:"game",platform:platform.length?platform:["غير محدد"],description:summary,source:"OSGL — Open Source Games List",sourceUrl,downloadUrl:safeUrl(download)?download:(safeUrl(play)?play:sourceUrl),homeUrl:home||null,codeRepository:repos[0]||null,license,assetsLicense:assets,verified:false,status:"osgl_metadata_requires_current_repo_build_and_asset_license_review"});
   done++;
  }catch(e){failed++}
 }
}
await Promise.all(Array.from({length:16},worker));
const unique=new Map();for(const x of items)unique.set(x.id,x);
const output={generatedAt:new Date().toISOString(),source:"Trilarion/opensourcegames (OSGL)",sourceLicense:"CC0-1.0; see upstream repository license for attribution and asset exclusions",sourceUrl:"https://github.com/Trilarion/opensourcegames",attempted:selected.length,failed,total:unique.size,notice:"OSGL metadata is public domain/CC0, but each game's code, assets, trademarks and download package have separate rights. Entries are discovery candidates, not permission to redistribute. The upstream list may contain outdated or inaccurate records.",items:[...unique.values()].sort((a,b)=>a.title.localeCompare(b.title))};
if(!output.total)throw new Error("OSGL import yielded no game records; refusing to overwrite.");
await fs.mkdir("data",{recursive:true});
await fs.writeFile("data/osgl-game-catalog.json",JSON.stringify(output,null,2)+"\n");
console.log("OSGL imported "+output.total+" entries; attempted "+output.attempted+", failed "+output.failed);
