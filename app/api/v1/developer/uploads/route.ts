import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getAuthenticatedUser, isSameOrigin } from "@/lib/current-user";
import { getObjectStorage } from "@/lib/object-storage";
import { getDbPool } from "@/lib/db";

export const runtime = "nodejs";
const MAX_BYTES = 200 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    if (!isSameOrigin(request)) return NextResponse.json({ error: "طلب غير مسموح" }, { status: 403 });
    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ error: "سجّل الدخول أولاً" }, { status: 401 });
    if (user.role !== "developer" && user.role !== "admin")
      return NextResponse.json({ error: "حساب المطوّر غير معتمد" }, { status: 403 });

    const body = await request.json();
    const filename = String(body.filename ?? "").split(/[\\/]/).pop()?.trim() ?? "";
    const size = Number(body.size);
    const contentType = String(body.contentType ?? "").toLowerCase();
    if (!filename || filename.length > 255 || /[\u0000-\u001f]/.test(filename))
      return NextResponse.json({ error: "اسم الملف غير صالح" }, { status: 400 });
    if (!Number.isSafeInteger(size) || size < 1 || size > MAX_BYTES)
      return NextResponse.json({ error: "حجم الملف يجب ألا يتجاوز 200 ميغابايت" }, { status: 400 });
    if (!filename.toLowerCase().endsWith(".zip") || !["application/zip", "application/x-zip-compressed", "application/octet-stream"].includes(contentType))
      return NextResponse.json({ error: "النسخة الأولى تقبل ملفات ZIP فقط" }, { status: 415 });

    const { client, bucket } = getObjectStorage();
    const id = randomUUID();
    const objectKey = `quarantine/${user.id}/${id}.zip`;
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      ContentType: "application/zip",
      ContentLength: size,
      Metadata: { "upload-id": id, "owner-id": user.id }
    });
    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 600 });
    const pool = getDbPool();
    await pool.execute(
      "INSERT INTO game_uploads (id, developer_id, object_key, original_filename, content_type, size_bytes, scan_status, review_status) VALUES (?, ?, ?, ?, 'application/zip', ?, 'pending', 'pending')",
      [id, user.id, objectKey, filename, size]
    );

    return NextResponse.json({
      uploadId: id,
      uploadUrl,
      method: "PUT",
      headers: { "Content-Type": "application/zip" },
      expiresInSeconds: 600,
      maxBytes: MAX_BYTES,
      state: "pending_scan"
    }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Upload initialization failed:", error);
    const missingStorage = error instanceof Error && error.message.includes("Object storage is not configured");
    return NextResponse.json({ error: missingStorage ? "تخزين الملفات غير مربوط بعد" : "تعذر تجهيز الرفع" }, { status: missingStorage ? 503 : 500 });
  }
}
