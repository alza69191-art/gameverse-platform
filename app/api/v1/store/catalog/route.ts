import {NextRequest,NextResponse} from "next/server";
import baseCatalog from "@/data/store-catalog.json";
import fdroidCatalog from "@/data/fdroid-catalog.json";
import openuseCatalog from "@/data/openuse-catalog.json";
import gameCatalog from "@/data/game-catalog.json";
import osglGameCatalog from "@/data/osgl-game-catalog.json";
import homebrewCatalog from "@/data/homebrew-catalog.json";
import {getDbPool} from "@/lib/db";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest){
 const params=request.nextUrl.searchParams;
 const q=(params.get("q")||"").trim().toLocaleLowerCase().slice(0,120);
 const kind=(params.get("kind")||"").trim();
 const category=(params.get("category")||"").trim();
 const platform=(params.get("platform")||"").trim();
 const limit=Math.max(1,Math.min(1000,Number(params.get("limit")||60)||60));
 const offset=Math.max(0,Math.min(100000,Number(params.get("offset")||0)||0));
 const items=[...(baseCatalog.items??[]),...((fdroidCatalog.items??[]) as any[]),...((openuseCatalog.items??[]) as any[]),...((gameCatalog.items??[]) as any[]),...((osglGameCatalog.items??[]) as any[]),...((homebrewCatalog.items??[]) as any[])];
 try{
  const [rows]=await getDbPool().execute("SELECT item_type AS type,title,slug,description,platform,source_url AS sourceUrl,download_url AS downloadUrl,license,license_url AS licenseUrl FROM catalog_submissions WHERE status='approved' ORDER BY title LIMIT 5000");
  for(const x of rows as any[]){
   items.push({id:"developer-"+x.slug,title:x.title,category:x.type==="website"?"مواقع":x.type==="browser_game"?"ألعاب متصفح":x.type==="download_game"?"ألعاب تنزيل":"تطبيقات",kind:x.type==="download_game"||x.type==="browser_game"?"game":"app",platform:String(x.platform).split(",").map((s:string)=>s.trim()),description:x.description,source:"مطور GameVerse",sourceUrl:x.sourceUrl,downloadUrl:x.downloadUrl||x.sourceUrl,license:x.license,verified:false,status:"developer_submission_approved"})
  }
 }catch(e){console.warn("Approved community catalog unavailable:",e)}
 const unique=new Map<string,any>();
 for(const x of items)unique.set(x.id||x.slug||x.title,x);
 const all=[...unique.values()];
 const categories=[...new Set(all.map(x=>String(x.category||"متنوع")))].sort((a,b)=>a.localeCompare(b));
 const filtered=all.filter(x=>(!q||(String(x.title||"")+" "+String(x.description||"")+" "+String(x.category||"")+" "+String(x.source||"")).toLocaleLowerCase().includes(q))&&(!kind||x.kind===kind)&&(!category||x.category===category)&&(!platform||(Array.isArray(x.platform)&&x.platform.includes(platform))));
 const page=filtered.slice(offset,offset+limit);
 return NextResponse.json({items:page,total:filtered.length,returned:page.length,offset,limit,hasMore:offset+page.length<filtered.length,categories,sources:{curated:baseCatalog.items?.length??0,fdroid:fdroidCatalog.items?.length??0,openuse:openuseCatalog.items?.length??0,games:gameCatalog.items?.length??0,osglGames:osglGameCatalog.items?.length??0,homebrew:homebrewCatalog.items?.length??0,community:"database"}},{headers:{"Cache-Control":"public, max-age=300, stale-while-revalidate=1800"}});
}
