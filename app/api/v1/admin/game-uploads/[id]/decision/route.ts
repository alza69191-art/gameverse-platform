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
    if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "معرّف الرفع غير صالح" }, { status: 400 });
    const body = await request.json();
    const decision = String(body.decision ?? "");
    const notes = String(body.notes ?? "").trim();
    if (!["approve", "reject"].includes(decision) || notes.length > 2000)
      return NextResponse.json({ error: "قرار المراجعة غير صالح" }, { status: 400 });

    connection = await getDbPool().getConnection();
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      "SELECT * FROM game_uploads WHERE id = ? FOR UPDATE", [id]
    );
    const upload = (rows as Array<{
      id:string;developer_id:number|bigint;game_title:string;game_slug:string;game_description:string;
      object_key:string;size_bytes:number|bigint;upload_status:string;scan_status:string;review_status:string;game_id:number|bigint|null
    }>)[0];
    if (!upload || upload.review_status !== "pending" || upload.upload_status !== "uploaded") {
      await connection.rollback();
      return NextResponse.json({ error: "الرفع غير جاهز للمراجعة أو تمت معالجته" }, { status: 409 });
    }
    if (decision === "approve" && upload.scan_status !== "clean") {
      await connection.rollback();
      return NextResponse.json({ error: "لا يمكن النشر قبل نتيجة فحص نظيفة من نظام مكافحة البرمجيات الضارة" }, { status: 409 });
    }

    let gameId = upload.game_id ? String(upload.game_id) : null;
    if (decision === "approve") {
      const [existing] = await connection.execute("SELECT id FROM games WHERE slug = ? LIMIT 1", [upload.game_slug]);
      if ((existing as unknown[]).length) {
        await connection.rollback();
        return NextResponse.json({ error: "معرّف اللعبة مستخدم مسبقاً" }, { status: 409 });
      }
      const [inserted] = await connection.execute(
        "INSERT INTO games (developer_id, title, slug, description, official_url, privacy_policy_url, game_type, status) VALUES (?, ?, ?, ?, NULL, NULL, 'download', 'approved')",
        [upload.developer_id, upload.game_title, upload.game_slug, upload.game_description]
      );
      gameId = String((inserted as {insertId:number|bigint}).insertId);
      await connection.execute(
        "INSERT INTO game_versions (game_id, version, platform, download_url, file_size_bytes) VALUES (?, '1.0.0', 'multi-platform-archive', ?, ?)",
        [gameId, upload.object_key, upload.size_bytes]
      );
      await connection.execute(
        "INSERT INTO review_events (game_id, admin_id, decision, notes) VALUES (?, ?, 'approved', ?)",
        [gameId, admin.id, notes || null]
      );
      await connection.execute(
        "UPDATE game_uploads SET review_status = 'approved', reviewed_at = CURRENT_TIMESTAMP, reviewed_by = ?, review_notes = ?, game_id = ? WHERE id = ?",
        [admin.id, notes || null, gameId, id]
      );
    } else {
      await connection.execute(
        "UPDATE game_uploads SET review_status = 'rejected', reviewed_at = CURRENT_TIMESTAMP, reviewed_by = ?, review_notes = ? WHERE id = ?",
        [admin.id, notes || "لم تستوفِ اللعبة متطلبات النشر", id]
      );
    }
    await connection.commit();
    return NextResponse.json({ success: true, decision, gameId });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Game upload review failed:", error);
    return NextResponse.json({ error: "تعذر حفظ قرار المراجعة" }, { status: 500 });
  } finally {
    connection?.release();
  }
}
