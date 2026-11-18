import { NextRequest, NextResponse } from "next/server";
import { loadCatalogData } from "@/lib/catalog-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SiteCatalog = {
  items?: any[];
  source?: string;
  license?: string;
  attribution?: string | null;
};

export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") || "").trim().toLocaleLowerCase().slice(0, 120);
  const limit = Math.max(1, Math.min(1000, Number(request.nextUrl.searchParams.get("limit") || 500) || 500));
  const siteCatalog = await loadCatalogData<SiteCatalog>(request, "site-catalog.json");
  const filtered = (siteCatalog.items || []).filter((item: any) =>
    !q || (item.title + " " + item.description + " " + item.category + " " + item.sourceUrl).toLocaleLowerCase().includes(q)
  );
  const items = filtered.slice(0, limit);
  return NextResponse.json({
    items,
    total: filtered.length,
    returned: items.length,
    source: siteCatalog.source,
    license: siteCatalog.license,
    attribution: siteCatalog.attribution || null
  }, {
    headers: { "Cache-Control": "public, max-age=1800, stale-while-revalidate=86400" }
  });
}
