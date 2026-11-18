import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/current-user";
import { getDbPool } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const admin = await getAuthenticatedUser(request);
    if (!admin || admin.role !== "admin") return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    const [rows] = await getDbPool().execute(
      "SELECT u.id, u.game_title AS title, u.game_slug AS slug, u.game_description AS description, u.original_filename AS filename, u.size_bytes AS sizeBytes, u.upload_status AS uploadStatus, u.scan_status AS scanStatus, u.review_status AS reviewStatus, u.created_at AS createdAt, d.email AS developerEmail, d.display_name AS developerName FROM game_uploads u JOIN users d ON d.id = u.developer_id ORDER BY u.created_at ASC LIMIT 200"
    );
    return NextResponse.json({ uploads: rows }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Admin upload queue failed:", error);
    return NextResponse.json({ error: "تعذر تحميل قائمة المراجعة" }, { status: 500 });
  }
}
