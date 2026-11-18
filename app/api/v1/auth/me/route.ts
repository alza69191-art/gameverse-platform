import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, sessionCookieName } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request.cookies.get(sessionCookieName())?.value);
    return NextResponse.json({ user: user ? {
      id: user.id, email: user.email, displayName: user.displayName, role: user.role
    } : null }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Session lookup failed:", error);
    return NextResponse.json({ error: "تعذر التحقق من الجلسة" }, { status: 500 });
  }
}
