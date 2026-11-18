import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, isSameOrigin } from "@/lib/current-user";
import { getDbPool } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ error: "سجّل الدخول أولاً" }, { status: 401 });
    const [rows] = await getDbPool().execute(
      "SELECT id, notification_type AS type, title, body, read_at AS readAt, created_at AS createdAt FROM user_notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 100",
      [user.id]
    );
    return NextResponse.json({ notifications: rows }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("User notifications lookup failed:", error);
    return NextResponse.json({ error: "تعذر تحميل الإشعارات" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isSameOrigin(request)) return NextResponse.json({ error: "طلب غير مسموح" }, { status: 403 });
    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ error: "سجّل الدخول أولاً" }, { status: 401 });
    const body = await request.json();
    const id = Number(body.id);
    if (!Number.isSafeInteger(id) || id < 1) return NextResponse.json({ error: "معرّف الإشعار غير صالح" }, { status: 400 });
    await getDbPool().execute(
      "UPDATE user_notifications SET read_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ? AND read_at IS NULL",
      [id, user.id]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Notification read update failed:", error);
    return NextResponse.json({ error: "تعذر تحديث الإشعار" }, { status: 500 });
  }
}
