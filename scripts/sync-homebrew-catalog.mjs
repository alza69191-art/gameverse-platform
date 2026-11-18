import fs from "node:fs/promises";
const headers={"accept":"application/json","user-agent":"GameVerse-Catalog-Sync/1.0"};
async function load(url){
 const r=await fetch(url,{headers,signal:AbortSignal.timeout(120000)});
 if(!r.ok)throw new Error("Homebrew API HTTP "+r.status+" at "+url);
 const data=await r.json();
 if(!Array.isArray(data))throw new Error("Unexpected Homebrew API response");
 return data;
}
const [formulae,casks]=await Promise.all([
 load("https://formulae.brew.sh/api/formula.json"),
 load("https://formulae.brew.sh/api/cask.json")
]);
const items=[];
function add(x,type){
 const name=String(x.name||x.token||"").trim();
 const homepage=String(x.homepage||"").trim();
 if(!name||!/^https?:\/\//i.test(homepage))return;
 const isCask=type==="cask";
 const token=String(x.token||name).toLowerCase();
 const title=name.replace(/[-_]+/g," ").replace(/\b\w/g,c=>c.toUpperCase());
 const page="https://formulae.brew.sh/"+(isCask?"cask/":"formula/")+encodeURIComponent(token)+"/";
 items.push({id:"homebrew-"+type+"-"+token,title,category:isCask?"تطبيقات macOS":"أدوات ومكتبات للمطورين",kind:"app",platform:isCask?["macOS"]:["macOS","Linux"],description:String(x.desc||"حزمة برمجية عبر Homebrew").replace(/\s+/g," ").slice(0,500),source:isCask?"Homebrew Cask catalogue":"Homebrew Formula catalogue",sourceUrl:page,downloadUrl:homepage,license:typeof x.license==="string"&&x.license?x.license:"راجع ترخيص المصدر",verified:false,status:"package_manager_metadata_only_check_upstream_platform_and_license"});
}
for(const x of formulae)add(x,"formula");
for(const x of casks)add(x,"cask");
const unique=new Map();
for(const x of items)unique.set(x.id,x);
const output={generatedAt:new Date().toISOString(),source:"Homebrew Formulae and Cask JSON APIs",sources:{formulae:formulae.length,casks:casks.length},total:unique.size,notice:"Homebrew package metadata only. GameVerse links to upstream project homepages and Homebrew package detail pages; it does not host package binaries. Check each package's actual supported OS, licence, publisher and availability.",items:[...unique.values()].sort((a,b)=>a.title.localeCompare(b.title))};
if(!output.total)throw new Error("No Homebrew packages returned; refusing to overwrite catalogue.");
await fs.writeFile("data/homebrew-catalog.json",JSON.stringify(output,null,2)+"\n","utf8");
console.log("Imported "+formulae.length+" formulae and "+casks.length+" casks; "+output.total+" records.");
