import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/current-user";
import { getDbPool } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ error: "سجّل الدخول أولاً" }, { status: 401 });
    if (user.role !== "developer" && user.role !== "admin")
      return NextResponse.json({ error: "حساب المطوّر غير معتمد" }, { status: 403 });
    const pool = getDbPool();
    const [rows] = await pool.execute(
      "SELECT id, game_title AS title, game_slug AS slug, original_filename AS filename, size_bytes AS sizeBytes, upload_status AS uploadStatus, scan_status AS scanStatus, review_status AS reviewStatus, created_at AS createdAt, review_notes AS reviewNotes FROM game_uploads WHERE developer_id = ? ORDER BY created_at DESC LIMIT 100",
      [user.id]
    );
    return NextResponse.json({ uploads: rows }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Developer uploads lookup failed:", error);
    return NextResponse.json({ error: "تعذر تحميل ملفاتك" }, { status: 500 });
  }
}
