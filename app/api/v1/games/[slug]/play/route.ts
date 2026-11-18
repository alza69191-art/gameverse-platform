import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, isSameOrigin } from "@/lib/current-user";
import { isKnownGameSlug } from "@/lib/game-validation";
import { consumeRateLimit } from "@/lib/rate-limit";
import { getDbPool } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    if (!isSameOrigin(request)) return NextResponse.json({ error: "طلب غير مسموح" }, { status: 403 });
    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ error: "سجّل الدخول لحفظ سجل اللعب" }, { status: 401 });
    const { slug } = await context.params;
    if (!(await isKnownGameSlug(slug))) return NextResponse.json({ error: "اللعبة غير موجودة" }, { status: 404 });
    const limit = await consumeRateLimit("play-history", `${user.id}:${slug}`, 30, 3600);
    if (!limit.allowed) return NextResponse.json({ error: "تم تسجيل نشاط كثير لهذه اللعبة" }, { status: 429 });
    const body = await request.json();
    const duration = Number(body.durationSeconds ?? 0);
    if (!Number.isInteger(duration) || duration < 0 || duration > 7200)
      return NextResponse.json({ error: "مدة اللعب غير صالحة" }, { status: 400 });
    await getDbPool().execute(
      "INSERT INTO game_play_history (user_id, game_slug, duration_seconds) VALUES (?, ?, ?)",
      [user.id, slug, duration]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Play history insert failed:", error);
    return NextResponse.json({ error: "تعذر حفظ سجل اللعب" }, { status: 500 });
  }
}
