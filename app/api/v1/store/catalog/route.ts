import {NextResponse} from "next/server";
import baseCatalog from "@/data/store-catalog.json";
import fdroidCatalog from "@/data/fdroid-catalog.json";
import openuseCatalog from "@/data/openuse-catalog.json";
import gameCatalog from "@/data/game-catalog.json";
import {getDbPool} from "@/lib/db";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(){
 const items=[...(baseCatalog.items??[]),...((fdroidCatalog.items??[]) as typeof baseCatalog.items),...((openuseCatalog.items??[]) as typeof baseCatalog.items),...((gameCatalog.items??[]) as typeof baseCatalog.items)];
 try{
  const [rows]=await getDbPool().execute("SELECT item_type AS type,title,slug,description,platform,source_url AS sourceUrl,download_url AS downloadUrl,license,license_url AS licenseUrl FROM catalog_submissions WHERE status='approved' ORDER BY title LIMIT 5000");
  for(const x of rows as any[]){
   items.push({id:"developer-"+x.slug,title:x.title,category:x.type==="website"?"مواقع":x.type==="browser_game"?"ألعاب متصفح":x.type==="download_game"?"ألعاب تنزيل":"تطبيقات",kind:x.type==="download_game"||x.type==="browser_game"?"game":"app",platform:String(x.platform).split(",").map((s:string)=>s.trim()),description:x.description,source:"مطور GameVerse",sourceUrl:x.sourceUrl,downloadUrl:x.downloadUrl||x.sourceUrl,license:x.license,verified:false,status:"developer_submission_approved"} as any)
  }
 }catch(e){console.warn("Approved community catalog unavailable:",e)}
 const unique=new Map<string,any>();
 for(const x of items as any[])unique.set(x.id||x.slug||x.title,x);
 const result=[...unique.values()];
 return NextResponse.json({items:result,total:result.length,sources:{curated:baseCatalog.items?.length??0,fdroid:fdroidCatalog.items?.length??0,openuse:openuseCatalog.items?.length??0,games:gameCatalog.items?.length??0,community:"database"}},{headers:{"Cache-Control":"public, max-age=300, stale-while-revalidate=1800"}})
}
