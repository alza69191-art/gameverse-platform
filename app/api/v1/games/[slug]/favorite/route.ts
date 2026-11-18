import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, isSameOrigin } from "@/lib/current-user";
import { isKnownGameSlug } from "@/lib/game-validation";
import { getDbPool } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    if (!isSameOrigin(request)) return NextResponse.json({ error: "طلب غير مسموح" }, { status: 403 });
    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ error: "سجّل الدخول لإضافة المفضلة" }, { status: 401 });
    const { slug } = await context.params;
    if (!(await isKnownGameSlug(slug))) return NextResponse.json({ error: "اللعبة غير موجودة" }, { status: 404 });
    await getDbPool().execute("INSERT IGNORE INTO user_favorites (user_id, game_slug) VALUES (?, ?)", [user.id, slug]);
    return NextResponse.json({ success: true, favorite: true });
  } catch (error) {
    console.error("Favorite add failed:", error);
    return NextResponse.json({ error: "تعذر حفظ المفضلة" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    if (!isSameOrigin(request)) return NextResponse.json({ error: "طلب غير مسموح" }, { status: 403 });
    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ error: "سجّل الدخول أولاً" }, { status: 401 });
    const { slug } = await context.params;
    await getDbPool().execute("DELETE FROM user_favorites WHERE user_id = ? AND game_slug = ?", [user.id, slug]);
    return NextResponse.json({ success: true, favorite: false });
  } catch (error) {
    console.error("Favorite removal failed:", error);
    return NextResponse.json({ error: "تعذر إزالة المفضلة" }, { status: 500 });
  }
}
