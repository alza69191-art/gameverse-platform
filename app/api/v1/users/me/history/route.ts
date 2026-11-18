import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/current-user";
import { getDbPool } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ error: "سجّل الدخول أولاً" }, { status: 401 });
    const [rows] = await getDbPool().execute(
      "SELECT game_slug AS slug, SUM(duration_seconds) AS totalSeconds, MAX(played_at) AS lastPlayed, COUNT(*) AS sessions FROM game_play_history WHERE user_id = ? GROUP BY game_slug ORDER BY lastPlayed DESC LIMIT 200",
      [user.id]
    );
    return NextResponse.json({ history: rows }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("User play history lookup failed:", error);
    return NextResponse.json({ error: "تعذر تحميل سجل اللعب" }, { status: 500 });
  }
}
