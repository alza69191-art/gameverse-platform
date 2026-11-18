import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, isSameOrigin } from "@/lib/current-user";
import { isKnownGameSlug } from "@/lib/game-validation";
import { getDbPool } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    if (!isSameOrigin(request)) return NextResponse.json({ error: "طلب غير مسموح" }, { status: 403 });
    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ error: "سجّل الدخول للإبلاغ" }, { status: 401 });
    const { slug } = await context.params;
    if (!(await isKnownGameSlug(slug))) return NextResponse.json({ error: "اللعبة غير موجودة" }, { status: 404 });
    const body = await request.json();
    const reason = String(body.reason ?? "");
    const details = String(body.details ?? "").trim();
    if (!["malware","copyright","broken","inappropriate","other"].includes(reason) || details.length < 10 || details.length > 2000)
      return NextResponse.json({ error: "اختر سبباً واكتب تفاصيل بين 10 و2000 حرف" }, { status: 400 });
    const [result] = await getDbPool().execute(
      "INSERT INTO game_reports (reporter_id, game_slug, reason, details) VALUES (?, ?, ?, ?)",
      [user.id, slug, reason, details]
    );
    return NextResponse.json({ success: true, reportId: String((result as {insertId:number|bigint}).insertId) }, { status: 201 });
  } catch (error) {
    console.error("Game report submission failed:", error);
    return NextResponse.json({ error: "تعذر إرسال البلاغ" }, { status: 500 });
  }
}
