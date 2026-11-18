import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const pool = getDbPool();
    const [rows] = await pool.query(
      "SELECT id, title, slug, description, official_url, game_type, status, created_at FROM games WHERE status = 'approved' ORDER BY created_at DESC"
    );
    return NextResponse.json({ games: rows });
  } catch (error) {
    console.error("Games API failed:", error);
    return NextResponse.json({ error: "تعذر تحميل الألعاب حالياً" }, { status: 503 });
  }
}
