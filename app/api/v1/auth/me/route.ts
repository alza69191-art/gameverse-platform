import { NextRequest, NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { readSessionToken, sessionCookieName } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(sessionCookieName())?.value;
    const session = readSessionToken(token);
    if (!session) return NextResponse.json({ user: null }, { status: 200, headers: { "Cache-Control": "no-store" } });

    const pool = getDbPool();
    const [rows] = await pool.execute(
      "SELECT id, email, display_name, role, status FROM users WHERE id = ? LIMIT 1",
      [session.sub]
    );
    const user = (rows as Array<{id:number|bigint;email:string;display_name:string;role:string;status:string}>)[0];
    if (!user || user.status !== "active")
      return NextResponse.json({ user: null }, { status: 200, headers: { "Cache-Control": "no-store" } });

    return NextResponse.json({
      user: { id: String(user.id), email: user.email, displayName: user.display_name, role: user.role }
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Session lookup failed:", error);
    return NextResponse.json({ error: "تعذر التحقق من الجلسة" }, { status: 500 });
  }
}
