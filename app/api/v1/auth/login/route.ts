import { NextRequest, NextResponse } from "next/server";
import { isSameOrigin } from "@/lib/current-user";
import { getDbPool } from "@/lib/db";
import { consumeRateLimit, requestIpKey } from "@/lib/rate-limit";
import { createSessionToken, sessionCookie, verifyPassword } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    if (!isSameOrigin(request)) return NextResponse.json({ error: "طلب غير مسموح" }, { status: 403 });
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    if (!email || !password || email.length > 255 || password.length > 128)
      return NextResponse.json({ error: "بيانات الدخول غير صحيحة" }, { status: 400 });
    const ipLimit = await consumeRateLimit("login-ip", requestIpKey(request), 20, 900);
    const emailLimit = await consumeRateLimit("login-email", email, 10, 900);
    if (!ipLimit.allowed || !emailLimit.allowed)
      return NextResponse.json({ error: "محاولات كثيرة. حاول بعد 15 دقيقة." }, { status: 429, headers: { "Retry-After": "900" } });

    const pool = getDbPool();
    const [rows] = await pool.execute(
      "SELECT id, email, password_hash, display_name, role, status FROM users WHERE email = ? LIMIT 1",
      [email]
    );
    const user = (rows as Array<{id:number|bigint;email:string;password_hash:string;display_name:string;role:string;status:string}>)[0];
    if (!user || user.status !== "active" || !(await verifyPassword(password, user.password_hash)))
      return NextResponse.json({ error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" }, { status: 401 });

    const userId = String(user.id);
    const response = NextResponse.json({ user: { id: userId, email: user.email, displayName: user.display_name, role: user.role } });
    response.headers.set("Set-Cookie", sessionCookie(await createSessionToken(userId)));
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    console.error("Login failed:", error);
    return NextResponse.json({ error: "تعذر تسجيل الدخول حالياً" }, { status: 500 });
  }
}
