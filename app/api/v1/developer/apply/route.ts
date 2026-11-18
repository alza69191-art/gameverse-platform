import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, isSameOrigin } from "@/lib/current-user";
import { getDbPool } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    if (!isSameOrigin(request)) return NextResponse.json({ error: "طلب غير مسموح" }, { status: 403 });
    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ error: "سجّل الدخول أولاً" }, { status: 401 });
    if (user.role !== "player") return NextResponse.json({ error: "لا يمكن إرسال طلب بهذه الصلاحية" }, { status: 403 });

    const body = await request.json();
    const studioName = String(body.studioName ?? "").trim();
    const contactEmail = String(body.contactEmail ?? "").trim().toLowerCase();
    const portfolioUrl = String(body.portfolioUrl ?? "").trim();
    const description = String(body.description ?? "").trim();
    if (studioName.length < 2 || studioName.length > 160 || description.length < 40 || description.length > 5000)
      return NextResponse.json({ error: "أدخل اسم استوديو ووصفاً واضحاً (40 حرفاً على الأقل)" }, { status: 400 });
    if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(contactEmail) || contactEmail.length > 255)
      return NextResponse.json({ error: "البريد الإلكتروني غير صالح" }, { status: 400 });
    if (portfolioUrl) {
      try { if (!["https:", "http:"].includes(new URL(portfolioUrl).protocol)) throw new Error(); }
      catch { return NextResponse.json({ error: "رابط معرض الأعمال غير صالح" }, { status: 400 }); }
    }

    const pool = getDbPool();
    const [existing] = await pool.execute("SELECT id, status FROM developer_applications WHERE user_id = ? LIMIT 1", [user.id]);
    if ((existing as Array<{id:number;status:string}>).length)
      return NextResponse.json({ error: "لديك طلب مطوّر مسجل مسبقاً" }, { status: 409 });
    await pool.execute(
      "INSERT INTO developer_applications (user_id, studio_name, portfolio_url, contact_email, description) VALUES (?, ?, ?, ?, ?)",
      [user.id, studioName, portfolioUrl || null, contactEmail, description]
    );
    return NextResponse.json({ success: true, status: "pending" }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Developer application failed:", error);
    return NextResponse.json({ error: "تعذر إرسال طلب المطوّر" }, { status: 500 });
  }
}
