import {NextResponse} from "next/server";
import {getDbPool} from "@/lib/db";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(){try{const [rows]=await getDbPool().execute("SELECT item_type AS type,title,slug,description,platform,source_url AS sourceUrl,download_url AS downloadUrl,license,license_url AS licenseUrl FROM catalog_submissions WHERE status='approved' ORDER BY title LIMIT 5000");return NextResponse.json({items:rows},{headers:{"Cache-Control":"public, max-age=300, stale-while-revalidate=1800"}})}catch(e){console.warn("Approved community catalog unavailable:",e);return NextResponse.json({items:[]},{headers:{"Cache-Control":"public, max-age=60"}})}}
