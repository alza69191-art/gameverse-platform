import {NextResponse} from "next/server";
import baseCatalog from "@/data/store-catalog.json";
import fdroidCatalog from "@/data/fdroid-catalog.json";
export const runtime="nodejs";
export const dynamic="force-static";
export async function GET(){
 const items=[...(baseCatalog.items??[]),...((fdroidCatalog.items??[]) as typeof baseCatalog.items)];
 return NextResponse.json({items,total:items.length,fdroidGeneratedAt:fdroidCatalog.generatedAt??null},{headers:{"Cache-Control":"public, max-age=3600, stale-while-revalidate=86400"}});
}
