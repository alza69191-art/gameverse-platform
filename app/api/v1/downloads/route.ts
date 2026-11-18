import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [rows] = await getDbPool().query(
      "SELECT g.title, g.slug, g.description, v.version, v.platform, v.file_size_bytes AS fileSizeBytes, v.created_at AS versionCreatedAt FROM games g JOIN game_versions v ON v.game_id = g.id WHERE g.status = 'approved' AND g.game_type IN ('download','both') AND v.download_url IS NOT NULL ORDER BY v.created_at DESC LIMIT 200"
    );
    return NextResponse.json({ games: rows }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Download catalog failed:", error);
    return NextResponse.json({ error: "تعذر تحميل الألعاب القابلة للتنزيل" }, { status: 503 });
  }
}
