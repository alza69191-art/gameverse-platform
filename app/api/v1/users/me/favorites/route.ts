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
      "SELECT game_slug AS slug, created_at AS createdAt FROM user_favorites WHERE user_id = ? ORDER BY created_at DESC LIMIT 500",
      [user.id]
    );
    return NextResponse.json({ favorites: rows }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("User favorites lookup failed:", error);
    return NextResponse.json({ error: "تعذر تحميل المفضلة" }, { status: 500 });
  }
}
