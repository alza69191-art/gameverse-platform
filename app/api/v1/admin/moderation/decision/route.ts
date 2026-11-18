import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, isSameOrigin } from "@/lib/current-user";
import { getDbPool } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let connection: Awaited<ReturnType<ReturnType<typeof getDbPool>["getConnection"]>> | undefined;
  try {
    if (!isSameOrigin(request)) return NextResponse.json({ error: "طلب غير مسموح" }, { status: 403 });
    const admin = await getAuthenticatedUser(request);
    if (!admin || admin.role !== "admin") return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    const body = await request.json();
    const type = String(body.type ?? "");
    const id = Number(body.id);
    const decision = String(body.decision ?? "");
    const notes = String(body.notes ?? "").trim();
    if (!["comment","review","report"].includes(type) || !Number.isSafeInteger(id) || id < 1 || notes.length > 2000)
      return NextResponse.json({ error: "بيانات المراجعة غير صالحة" }, { status: 400 });
    if ((type === "comment" || type === "review") && !["approve","reject"].includes(decision))
      return NextResponse.json({ error: "قرار المراجعة غير صالح" }, { status: 400 });
    if (type === "report" && !["resolve","dismiss"].includes(decision))
      return NextResponse.json({ error: "قرار البلاغ غير صالح" }, { status: 400 });

    connection = await getDbPool().getConnection();
    await connection.beginTransaction();
    const table = type === "comment" ? "game_comments" : type === "review" ? "game_reviews" : "game_reports";
    const [rows] = await connection.execute(`SELECT id, user_id, status FROM ${table} WHERE id = ? FOR UPDATE`, [id]);
    const item = (rows as Array<{id:number;user_id:number|bigint;status:string}>)[0];
    if (!item) {
      await connection.rollback();
      return NextResponse.json({ error: "العنصر غير موجود" }, { status: 404 });
    }
    const allowedStatus = type === "report" ? ["open","in_review"] : ["pending"];
    if (!allowedStatus.includes(item.status)) {
      await connection.rollback();
      return NextResponse.json({ error: "تمت معالجة هذا العنصر مسبقاً" }, { status: 409 });
    }

    if (type === "comment" || type === "review") {
      const status = decision === "approve" ? "approved" : "rejected";
      await connection.execute(
        `UPDATE ${table} SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'pending'`,
        [status, admin.id, id]
      );
      await connection.execute(
        "INSERT INTO user_notifications (user_id, notification_type, title, body) VALUES (?, 'moderation', ?, ?)",
        [item.user_id, type === "comment" ? "مراجعة تعليقك" : "مراجعة تقييمك", decision === "approve" ? "تمت الموافقة على مشاركتك وأصبحت ظاهرة للآخرين." : (notes || "لم تتم الموافقة على مشاركتك. يمكنك مراجعة قواعد المجتمع.")]
      );
    } else {
      const status = decision === "resolve" ? "resolved" : "dismissed";
      await connection.execute(
        "UPDATE game_reports SET status = ?, assigned_admin = ?, admin_notes = ?, resolved_at = CURRENT_TIMESTAMP WHERE id = ? AND status IN ('open','in_review')",
        [status, admin.id, notes || null, id]
      );
      await connection.execute(
        "INSERT INTO user_notifications (user_id, notification_type, title, body) VALUES (?, 'report', 'تحديث البلاغ', ?)",
        [item.user_id, decision === "resolve" ? "تمت معالجة البلاغ الذي أرسلته." : "تمت مراجعة البلاغ وإغلاقه."]
      );
    }

    await connection.execute(
      "INSERT INTO admin_audit_logs (actor_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)",
      [admin.id, decision, type, String(id), JSON.stringify({ notes })]
    );
    await connection.commit();
    return NextResponse.json({ success: true, type, decision });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Moderation decision failed:", error);
    return NextResponse.json({ error: "تعذر حفظ قرار الإشراف" }, { status: 500 });
  } finally {
    connection?.release();
  }
}
