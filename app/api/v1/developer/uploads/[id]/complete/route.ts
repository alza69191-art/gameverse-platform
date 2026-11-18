import { NextRequest, NextResponse } from "next/server";
import { HeadObjectCommand } from "@aws-sdk/client-s3";
import { getAuthenticatedUser, isSameOrigin } from "@/lib/current-user";
import { getObjectStorage } from "@/lib/object-storage";
import { getDbPool } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    if (!isSameOrigin(request)) return NextResponse.json({ error: "طلب غير مسموح" }, { status: 403 });
    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ error: "سجّل الدخول أولاً" }, { status: 401 });
    const { id } = await context.params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "معرّف رفع غير صالح" }, { status: 400 });

    const pool = getDbPool();
    const [rows] = await pool.execute(
      "SELECT id, developer_id, object_key, size_bytes, upload_status FROM game_uploads WHERE id = ? LIMIT 1", [id]
    );
    const upload = (rows as Array<{id:string;developer_id:number|bigint;object_key:string;size_bytes:number|bigint;upload_status:string}>)[0];
    if (!upload || (String(upload.developer_id) !== user.id && user.role !== "admin"))
      return NextResponse.json({ error: "الملف غير موجود" }, { status: 404 });
    if (upload.upload_status === "uploaded")
      return NextResponse.json({ uploadId: id, state: "pending_scan" }, { headers: { "Cache-Control": "no-store" } });

    const { client, bucket } = getObjectStorage();
    const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: upload.object_key }));
    if (!head.ContentLength || Number(head.ContentLength) !== Number(upload.size_bytes) || head.ContentType !== "application/zip")
      return NextResponse.json({ error: "الملف المرفوع لا يطابق بيانات الرفع المطلوبة" }, { status: 422 });

    await pool.execute("UPDATE game_uploads SET upload_status = 'uploaded' WHERE id = ? AND upload_status = 'initiated'", [id]);
    return NextResponse.json({
      uploadId: id,
      state: "pending_scan",
      message: "تم استلام الملف في الحجر. لن يظهر للزوار قبل فحصه ومراجعته."
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Upload completion failed:", error);
    return NextResponse.json({ error: "تعذر تأكيد استلام الملف" }, { status: 500 });
  }
}
