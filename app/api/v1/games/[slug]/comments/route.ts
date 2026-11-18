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
    const [rows] = await getDbPool().execute(
      "SELECT c.id, c.parent_id AS parentId, c.body, c.created_at AS createdAt, u.display_name AS displayName FROM game_comments c JOIN users u ON u.id = c.user_id WHERE c.game_slug = ? AND c.status = 'approved' ORDER BY c.created_at DESC LIMIT 100",
      [slug]
    );
    return NextResponse.json({ comments: rows }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Game comments lookup failed:", error);
    return NextResponse.json({ error: "تعذر تحميل التعليقات" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    if (!isSameOrigin(request)) return NextResponse.json({ error: "طلب غير مسموح" }, { status: 403 });
    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ error: "سجّل الدخول لإضافة تعليق" }, { status: 401 });
    const limit = await consumeRateLimit("comment", `${user.id}:${slug}`, 8, 3600);
    if (!limit.allowed) return NextResponse.json({ error: "تجاوزت الحد المسموح. حاول لاحقاً." }, { status: 429 });
    const { slug } = await context.params;
    if (!(await isKnownGameSlug(slug))) return NextResponse.json({ error: "اللعبة غير موجودة" }, { status: 404 });
    const body = await request.json();
    const comment = String(body.body ?? "").trim();
    const parentId = body.parentId == null ? null : Number(body.parentId);
    if (comment.length < 2 || comment.length > 2000 || (parentId !== null && (!Number.isSafeInteger(parentId) || parentId < 1)))
      return NextResponse.json({ error: "التعليق أو الرد غير صالح" }, { status: 400 });
    if (parentId !== null) {
      const [parent] = await getDbPool().execute(
        "SELECT id FROM game_comments WHERE id = ? AND game_slug = ? AND status = 'approved' LIMIT 1",
        [parentId, slug]
      );
      if (!(parent as unknown[]).length) return NextResponse.json({ error: "التعليق الأصلي غير متاح" }, { status: 404 });
    }
    const [result] = await getDbPool().execute(
      "INSERT INTO game_comments (user_id, game_slug, parent_id, body, status) VALUES (?, ?, ?, ?, 'pending')",
      [user.id, slug, parentId, comment]
    );
    return NextResponse.json({ success: true, id: String((result as {insertId:number|bigint}).insertId), status: "pending" }, { status: 201 });
  } catch (error) {
    console.error("Game comment submission failed:", error);
    return NextResponse.json({ error: "تعذر إرسال التعليق" }, { status: 500 });
  }
}
