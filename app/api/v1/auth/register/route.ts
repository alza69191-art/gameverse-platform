import { NextRequest, NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { consumeRateLimit, requestIpKey } from "@/lib/rate-limit";
import { hashPassword, createSessionToken, sessionCookie } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const displayName = String(body.displayName ?? "").trim();
    const password = String(body.password ?? "");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255)
      return NextResponse.json({ error: "البريد الإلكتروني غير صالح" }, { status: 400 });
    if (displayName.length < 2 || displayName.length > 100)
      return NextResponse.json({ error: "الاسم يجب أن يكون بين حرفين و100 حرف" }, { status: 400 });
    if (password.length < 10 || password.length > 128)
      return NextResponse.json({ error: "كلمة المرور يجب أن تكون بين 10 و128 حرفاً" }, { status: 400 });
    const ipLimit = await consumeRateLimit("register-ip", requestIpKey(request), 5, 3600);
    const emailLimit = await consumeRateLimit("register-email", email, 3, 3600);
    if (!ipLimit.allowed || !emailLimit.allowed)
      return NextResponse.json({ error: "طلبات كثيرة. حاول بعد ساعة." }, { status: 429, headers: { "Retry-After": "3600" } });

    const pool = getDbPool();
    const [existing] = await pool.execute("SELECT id FROM users WHERE email = ? LIMIT 1", [email]);
    if ((existing as unknown[]).length)
      return NextResponse.json({ error: "البريد الإلكتروني مسجل مسبقاً" }, { status: 409 });

    const passwordHash = await hashPassword(password);
    const [result] = await pool.execute(
      "INSERT INTO users (email, password_hash, display_name, role, status) VALUES (?, ?, ?, 'player', 'active')",
      [email, passwordHash, displayName]
    );
    const userId = String((result as { insertId: number | bigint }).insertId);
    const response = NextResponse.json({ user: { id: userId, email, displayName, role: "player" } }, { status: 201 });
    response.headers.set("Set-Cookie", sessionCookie(createSessionToken(userId)));
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    console.error("Registration failed:", error);
    return NextResponse.json({ error: "تعذر إنشاء الحساب حالياً" }, { status: 500 });
  }
}
