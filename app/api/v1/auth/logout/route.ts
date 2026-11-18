import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie, revokeSession, sessionCookieName } from "@/lib/auth";
import { isSameOrigin } from "@/lib/current-user";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "طلب غير مسموح" }, { status: 403 });
  try {
    await revokeSession(request.cookies.get(sessionCookieName())?.value);
    const response = NextResponse.json({ success: true });
    response.headers.set("Set-Cookie", clearSessionCookie());
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    console.error("Session revocation failed:", error);
    return NextResponse.json({ error: "تعذر إنهاء الجلسة" }, { status: 500 });
  }
}
