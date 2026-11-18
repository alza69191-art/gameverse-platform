import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const secret = process.env.SCAN_WEBHOOK_SECRET;
  const supplied = request.headers.get("x-scanner-token") ?? "";
  if (!secret || secret.length < 32 || supplied.length !== secret.length ||
      !timingSafeEqual(Buffer.from(supplied), Buffer.from(secret))) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const id = String(body.uploadId ?? "");
    const status = String(body.status ?? "");
    if (!/^[0-9a-f-]{36}$/i.test(id) || !["clean", "infected", "error"].includes(status))
      return NextResponse.json({ error: "نتيجة الفحص غير صالحة" }, { status: 400 });
    const pool = getDbPool();
    const [result] = await pool.execute(
      "UPDATE game_uploads SET scan_status = ?, scanned_at = CURRENT_TIMESTAMP WHERE id = ? AND upload_status = 'uploaded' AND scan_status = 'pending'",
      [status, id]
    );
    if ((result as {affectedRows:number}).affectedRows !== 1)
      return NextResponse.json({ error: "الرفع غير موجود أو تمت معالجته" }, { status: 409 });
    return NextResponse.json({ success: true, uploadId: id, scanStatus: status });
  } catch (error) {
    console.error("Scanner callback failed:", error);
    return NextResponse.json({ error: "تعذر تسجيل نتيجة الفحص" }, { status: 500 });
  }
}
