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
    if (id === admin.id) return NextResponse.json({ error: "لا يمكنك تغيير صلاحيتك بنفسك" }, { status: 400 });
    const body = await request.json();
    const role = String(body.role ?? "");
    const notes = String(body.notes ?? "").trim();
    if (!["player", "developer", "admin"].includes(role) || notes.length > 1000)
      return NextResponse.json({ error: "الصلاحية أو الملاحظات غير صالحة" }, { status: 400 });

    connection = await getDbPool().getConnection();
    await connection.beginTransaction();
    const [rows] = await connection.execute("SELECT id, role, status FROM users WHERE id = ? FOR UPDATE", [id]);
    const target = (rows as Array<{id:number|bigint;role:string;status:string}>)[0];
    if (!target || target.status !== "active") {
      await connection.rollback();
      return NextResponse.json({ error: "الحساب غير موجود أو غير نشط" }, { status: 404 });
    }
    if (role === "developer") {
      const [applications] = await connection.execute(
        "SELECT id FROM developer_applications WHERE user_id = ? AND status = 'approved' LIMIT 1", [id]
      );
      if (!(applications as unknown[]).length) {
        await connection.rollback();
        return NextResponse.json({ error: "لا يمكن منح صلاحية مطوّر دون طلب معتمد" }, { status: 409 });
      }
    }
    if (target.role === "admin" && role !== "admin") {
      const [counts] = await connection.execute("SELECT COUNT(*) AS total FROM users WHERE role = 'admin' AND status = 'active'");
      if (Number((counts as Array<{total:number}>)[0]?.total ?? 0) <= 1) {
        await connection.rollback();
        return NextResponse.json({ error: "لا يمكن إزالة آخر مشرف نشط" }, { status: 409 });
      }
    }
    await connection.execute("UPDATE users SET role = ? WHERE id = ?", [role, id]);
    await connection.execute(
      "INSERT INTO user_notifications (user_id, notification_type, title, body) VALUES (?, 'role_change', 'تحديث صلاحية الحساب', ?)",
      [id, "تم تحديث صلاحية حسابك إلى: " + role]
    );
    await connection.execute(
      "INSERT INTO admin_audit_logs (actor_id, action, entity_type, entity_id, details) VALUES (?, 'role_changed', 'user', ?, ?)",
      [admin.id, id, JSON.stringify({ previousRole: target.role, role, notes })]
    );
    await connection.commit();
    return NextResponse.json({ success: true, role });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Admin role update failed:", error);
    return NextResponse.json({ error: "تعذر تحديث صلاحية المستخدم" }, { status: 500 });
  } finally {
    connection?.release();
  }
}
