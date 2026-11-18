import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/current-user";
import { getDbPool } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const admin = await getAuthenticatedUser(request);
    if (!admin || admin.role !== "admin") return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    const pool = getDbPool();
    const [comments] = await pool.query(
      "SELECT c.id, c.game_slug AS gameSlug, c.body, c.created_at AS createdAt, u.display_name AS displayName FROM game_comments c JOIN users u ON u.id = c.user_id WHERE c.status = 'pending' ORDER BY c.created_at ASC LIMIT 100"
    );
    const [reviews] = await pool.query(
      "SELECT r.id, r.game_slug AS gameSlug, r.rating, r.review_text AS reviewText, r.created_at AS createdAt, u.display_name AS displayName FROM game_reviews r JOIN users u ON u.id = r.user_id WHERE r.status = 'pending' ORDER BY r.created_at ASC LIMIT 100"
    );
    const [reports] = await pool.query(
      "SELECT r.id, r.game_slug AS gameSlug, r.reason, r.details, r.created_at AS createdAt, u.display_name AS displayName, u.email FROM game_reports r JOIN users u ON u.id = r.reporter_id WHERE r.status IN ('open','in_review') ORDER BY r.created_at ASC LIMIT 100"
    );
    return NextResponse.json({ comments, reviews, reports }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Moderation queue failed:", error);
    return NextResponse.json({ error: "تعذر تحميل قائمة الإشراف" }, { status: 500 });
  }
}
