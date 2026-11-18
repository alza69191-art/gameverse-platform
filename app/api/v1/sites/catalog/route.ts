import {NextRequest,NextResponse} from "next/server";
import siteCatalog from "@/data/site-catalog.json";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest){
 const q=(request.nextUrl.searchParams.get("q")||"").trim().toLocaleLowerCase().slice(0,120);
 const limit=Math.max(1,Math.min(25000,Number(request.nextUrl.searchParams.get("limit")||25000)||10000));
 const filtered=(siteCatalog.items||[]).filter((item:any)=>!q||(item.title+" "+item.description+" "+item.category+" "+item.sourceUrl).toLocaleLowerCase().includes(q));
 const items=filtered.slice(0,limit);
 return NextResponse.json({items,total:filtered.length,returned:items.length,source:siteCatalog.source,license:siteCatalog.license,attribution:(siteCatalog as any).attribution||null},{headers:{"Cache-Control":"public, max-age=1800, stale-while-revalidate=86400"}});
}
