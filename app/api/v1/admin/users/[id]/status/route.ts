import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, isSameOrigin } from "@/lib/current-user";
import { getDbPool } from "@/lib/db";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  let connection: Awaited<ReturnType<ReturnType<typeof getDbPool>["getConnection"]>> | undefined;
  try {
    if (!isSameOrigin(request)) return NextResponse.json({ error: "طلب غير مسموح" }, { status: 403 });
    const admin = await getAuthenticatedUser(request);
    if (!admin || admin.role !== "admin") return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    const { id } = await context.params;
    if (!/^\d+$/.test(id)) return NextResponse.json({ error: "معرّف المستخدم غير صالح" }, { status: 400 });
    if (id === admin.id) return NextResponse.json({ error: "لا يمكنك تعليق حسابك بنفسك" }, { status: 400 });
    const body = await request.json();
    const status = String(body.status ?? "");
    const notes = String(body.notes ?? "").trim();
    if (!["active","suspended"].includes(status) || notes.length > 1000)
      return NextResponse.json({ error: "الحالة غير صالحة" }, { status: 400 });

    connection = await getDbPool().getConnection();
    await connection.beginTransaction();
    const [rows] = await connection.execute("SELECT id, role, status FROM users WHERE id = ? FOR UPDATE", [id]);
    const target = (rows as Array<{id:number|bigint;role:string;status:string}>)[0];
    if (!target || target.role === "admin") {
      await connection.rollback();
      return NextResponse.json({ error: "لا يمكن تعديل هذا الحساب" }, { status: 404 });
    }
    await connection.execute("UPDATE users SET status = ? WHERE id = ?", [status, id]);
    await connection.execute(
      "INSERT INTO user_notifications (user_id, notification_type, title, body) VALUES (?, 'account_status', 'تحديث حالة الحساب', ?)",
      [id, status === "active" ? "تمت إعادة تفعيل حسابك." : (notes || "تم تعليق حسابك من إدارة المنصة.")]
    );
    await connection.execute(
      "INSERT INTO admin_audit_logs (actor_id, action, entity_type, entity_id, details) VALUES (?, ?, 'user', ?, ?)",
      [admin.id, status, id, JSON.stringify({ previousStatus: target.status, notes })]
    );
    await connection.commit();
    return NextResponse.json({ success: true, status });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Admin user status update failed:", error);
    return NextResponse.json({ error: "تعذر تحديث حالة المستخدم" }, { status: 500 });
  } finally {
    connection?.release();
  }
}
