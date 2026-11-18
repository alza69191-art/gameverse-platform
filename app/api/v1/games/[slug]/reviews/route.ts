import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, isSameOrigin } from "@/lib/current-user";
import { isKnownGameSlug } from "@/lib/game-validation";
import { getDbPool } from "@/lib/db";
import { consumeRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    if (!(await isKnownGameSlug(slug))) return NextResponse.json({ error: "اللعبة غير موجودة" }, { status: 404 });
    const pool = getDbPool();
    const [summaryRows] = await pool.execute(
      "SELECT ROUND(AVG(rating), 1) AS averageRating, COUNT(*) AS ratingCount FROM game_reviews WHERE game_slug = ? AND status = 'approved'",
      [slug]
    );
    const [reviews] = await pool.execute(
      "SELECT r.id, r.rating, r.review_text AS reviewText, r.created_at AS createdAt, u.display_name AS displayName FROM game_reviews r JOIN users u ON u.id = r.user_id WHERE r.game_slug = ? AND r.status = 'approved' ORDER BY r.created_at DESC LIMIT 100",
      [slug]
    );
    return NextResponse.json({ summary: (summaryRows as unknown[])[0], reviews }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Game reviews lookup failed:", error);
    return NextResponse.json({ error: "تعذر تحميل التقييمات" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    if (!isSameOrigin(request)) return NextResponse.json({ error: "طلب غير مسموح" }, { status: 403 });
    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ error: "سجّل الدخول لإضافة تقييم" }, { status: 401 });
    const { slug } = await context.params;
    const limit = await consumeRateLimit("review", `${user.id}:${slug}`, 3, 3600);
    if (!limit.allowed) return NextResponse.json({ error: "تجاوزت الحد المسموح. حاول لاحقاً." }, { status: 429 });
    if (!(await isKnownGameSlug(slug))) return NextResponse.json({ error: "اللعبة غير موجودة" }, { status: 404 });
    const body = await request.json();
    const rating = Number(body.rating);
    const reviewText = String(body.reviewText ?? "").trim();
    if (!Number.isInteger(rating) || rating < 1 || rating > 5 || reviewText.length > 2000)
      return NextResponse.json({ error: "التقييم يجب أن يكون من 1 إلى 5 والنص حتى 2000 حرف" }, { status: 400 });
    await getDbPool().execute(
      "INSERT INTO game_reviews (user_id, game_slug, rating, review_text, status) VALUES (?, ?, ?, ?, 'pending') ON DUPLICATE KEY UPDATE rating = VALUES(rating), review_text = VALUES(review_text), status = 'pending', reviewed_by = NULL, reviewed_at = NULL, updated_at = CURRENT_TIMESTAMP",
      [user.id, slug, rating, reviewText || null]
    );
    return NextResponse.json({ success: true, status: "pending" }, { status: 201 });
  } catch (error) {
    console.error("Game review submission failed:", error);
    return NextResponse.json({ error: "تعذر إرسال التقييم" }, { status: 500 });
  }
}
