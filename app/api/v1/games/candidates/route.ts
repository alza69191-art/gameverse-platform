import { NextRequest, NextResponse } from "next/server";
import { loadCatalogData } from "@/lib/catalog-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const data = await loadCatalogData(request, "game-candidates.json");
  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" }
  });
}
