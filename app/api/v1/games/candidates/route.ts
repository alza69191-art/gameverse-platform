import {NextResponse} from "next/server";
import data from "@/data/game-candidates.json";
export const runtime="nodejs";
export const dynamic="force-static";
export async function GET(){
 return NextResponse.json(data,{headers:{"Cache-Control":"public, max-age=3600, stale-while-revalidate=86400"}});
}
