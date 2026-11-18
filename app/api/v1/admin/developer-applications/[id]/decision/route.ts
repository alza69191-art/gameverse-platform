import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, isSameOrigin } from "@/lib/current-user";
import { getDbPool } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  let connection: Awaited<ReturnType<ReturnType<typeof getDbPool>["getConnection"]>> | undefined;
  try {
    if (!isSameOrigin(request)) return NextResponse.json({ error: "طلب غير مسموح" }, { status: 403 });
    const admin = await getAuthenticatedUser(request);
    if (!admin || admin.role !== "admin") return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    const { id } = await context.params;
    const applicationId = Number(id);
    if (!Number.isSafeInteger(applicationId) || applicationId < 1)
      return NextResponse.json({ error: "رقم الطلب غير صالح" }, { status: 400 });
    const body = await request.json();
    const decision = String(body.decision ?? "");
    const notes = String(body.notes ?? "").trim();
    if (!["approve", "reject"].includes(decision) || notes.length > 2000)
      return NextResponse.json({ error: "قرار المراجعة غير صالح" }, { status: 400 });

    connection = await getDbPool().getConnection();
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      "SELECT user_id, status FROM developer_applications WHERE id = ? FOR UPDATE", [applicationId]
    );
    const application = (rows as Array<{user_id:number|bigint;status:string}>)[0];
    if (!application || application.status !== "pending") {
      await connection.rollback();
      return NextResponse.json({ error: "الطلب غير موجود أو تمت مراجعته مسبقاً" }, { status: 409 });
    }
    const status = decision === "approve" ? "approved" : "rejected";
    await connection.execute(
      "UPDATE developer_applications SET status = ?, reviewed_by = ?, review_notes = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?",
      [status, admin.id, notes || null, applicationId]
    );
    if (decision === "approve") {
      await connection.execute("UPDATE users SET role = 'developer' WHERE id = ? AND status = 'active'", [application.user_id]);
    }
    await connection.commit();
    return NextResponse.json({ success: true, status });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Developer application decision failed:", error);
    return NextResponse.json({ error: "تعذر حفظ قرار المراجعة" }, { status: 500 });
  } finally {
    connection?.release();
  }
}
