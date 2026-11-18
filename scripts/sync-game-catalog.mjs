import fs from "node:fs/promises";
import { mkdir } from "node:fs/promises";

const headers = {"accept":"application/json","user-agent":"GameVerse-Catalog-Sync/1.0 (+https://gameverse-platform.onrender.com)"};
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const platformMap = value => {
  const s=String(value||"").toLowerCase();
  if(/android/.test(s))return "Android";
  if(/ios|iphone|ipad/.test(s))return "iOS";
  if(/windows|pc/.test(s))return "Windows";
  if(/mac|osx/.test(s))return "macOS";
  if(/linux/.test(s))return "Linux";
  if(/web|browser/.test(s))return "Web";
  return null;
};
const clean = value => String(value||"").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim().slice(0,500);
const items = new Map();
let sourceCounts = {openGames:0,sorcade:0,freeToGame:0};
function add(item) {
  if(!item.title || !item.downloadUrl) return;
  const key=clean(item.title).toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu,"-");
  if(!key)return;
  const prior=items.get(key);
  const score=x=>(x.license&&x.license!=="Unknown — review source"?2:0)+(x.description?1:0)+(x.platform.length?1:0)+(x.sourceUrl?1:0);
  if(!prior||score(item)>score(prior))items.set(key,item);
}
async function getJson(url) {
  let lastError;
  for(let attempt=0;attempt<3;attempt++){
    try{
      const response=await fetch(url,{headers,signal:AbortSignal.timeout(45000)});
      if(!response.ok)throw new Error("HTTP "+response.status+" from "+url);
      return await response.json();
    }catch(error){
      lastError=error;
      if(attempt<2)await sleep(1500*(attempt+1));
    }
  }
  throw lastError;
}

// OpenGames: paginated public directory of 2,000+ open-source games.
try {
  for(let page=1;page<=35;page++){
    const payload=await getJson("https://opengames.dev/api/games?page="+page+"&pageSize=100&sort=stars&order=desc");
    const games=payload?.data?.games||payload?.games||[];
    for(const g of games){
      const repo=g.repoUrl||g.repositoryUrl||"";
      const home=g.homepage||g.website||repo;
      const platforms=(Array.isArray(g.platforms)?g.platforms:[]).map(platformMap).filter(Boolean);
      add({id:"opengames-"+(g.slug||g.id||clean(g.title)),title:clean(g.title),category:clean(g.genre)||"ألعاب مفتوحة المصدر",kind:"game",platform:[...new Set(platforms.length?platforms:["متعدد"])],description:clean(g.description),source:"OpenGames public catalogue",sourceUrl:repo||home,downloadUrl:repo||home,license:g.license||"Unknown — review source",verified:false,status:"external_metadata_license_and_assets_review_required"});
    }
    sourceCounts.openGames+=games.length;
    const pages=Number(payload?.meta?.totalPages||payload?.data?.meta?.totalPages||0);
    if(!games.length||games.length<100||(pages&&page>=pages))break;
    await sleep(700);
  }
  console.log("OpenGames records:",sourceCounts.openGames);
}catch(error){console.warn("OpenGames source skipped:",String(error).slice(0,240));}

// Sorcade: public JSON export of curated open-source game discovery records.
try {
  const payload=await getJson("https://sorcade.uairi.org/api/games.json");
  for(const g of payload.games||[]){
    const repo=g.repoUrl||"";
    const play=g.playUrl||g.homepage||"";
    const download=g.downloadUrl||repo||play;
    if(!download)continue;
    const platforms=(g.platforms||[]).map(platformMap).filter(Boolean);
    const summary=typeof g.summary==="string"?g.summary:g.summary?.en||"";
    add({id:"sorcade-"+(g.slug||clean(g.title)),title:clean(g.title),category:(g.genres||[]).join(" / ")||"ألعاب مفتوحة المصدر",kind:"game",platform:[...new Set(platforms.length?platforms:["متعدد"])],description:clean(summary),source:"Sorcade open-source game directory",sourceUrl:repo||g.url||play,downloadUrl:download,license:g.license||"Unknown — review source",verified:false,status:"external_metadata_license_and_assets_review_required"});
  }
  sourceCounts.sorcade=(payload.games||[]).length;
  console.log("Sorcade records:",sourceCounts.sorcade);
}catch(error){console.warn("Sorcade source skipped:",String(error).slice(0,240));}

// FreeToGame: free-to-play discovery metadata. This is NOT an open-source licence feed.
try {
  const games=await getJson("https://www.freetogame.com/api/games");
  for(const g of Array.isArray(games)?games:[]){
    const profile=g.freetogame_profile_url||g.game_url;
    const play=g.game_url||profile;
    const platforms=[...new Set(String(g.platform||"").split(/,|\//).map(platformMap).filter(Boolean))];
    add({id:"freetogame-"+g.id,title:clean(g.title),category:clean(g.genre)||"Free-to-play",kind:"game",platform:platforms.length?platforms:["Windows"],description:clean(g.short_description),source:"FreeToGame discovery catalogue",sourceUrl:profile,downloadUrl:play,license:"Proprietary / free-to-play; publisher terms apply",verified:false,status:"external_free_to_play_listing_not_redistribution_permission"});
  }
  sourceCounts.freeToGame=Array.isArray(games)?games.length:0;
  console.log("FreeToGame records:",sourceCounts.freeToGame);
}catch(error){console.warn("FreeToGame source skipped:",String(error).slice(0,240));}

const output={generatedAt:new Date().toISOString(),sources:sourceCounts,total:items.size,notice:"Discovery metadata only. Free-to-play does not mean open-source or redistributable. All records are unverified; follow the source link and check publisher, regional availability, licence, assets and current download terms before hosting files.",items:[...items.values()].sort((a,b)=>a.title.localeCompare(b.title))};
if(!output.total)throw new Error("No game catalogue source returned usable records; refusing to overwrite the existing catalogue.");
await mkdir("data",{recursive:true});
await fs.writeFile("data/game-catalog.json",JSON.stringify(output,null,2)+"\n","utf8");
console.log("Wrote "+output.total+" unique game records to data/game-catalog.json");
