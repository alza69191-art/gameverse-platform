import { NextRequest, NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getObjectStorage } from "@/lib/object-storage";
import { getDbPool } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const [rows] = await getDbPool().execute(
      "SELECT g.title, v.download_url AS objectKey, v.version, v.platform FROM games g JOIN game_versions v ON v.game_id = g.id WHERE g.slug = ? AND g.status = 'approved' AND g.game_type IN ('download','both') ORDER BY v.created_at DESC LIMIT 1",
      [slug]
    );
    const game = (rows as Array<{title:string;objectKey:string;version:string;platform:string}>)[0];
    if (!game || !game.objectKey) return NextResponse.json({ error: "اللعبة غير متاحة للتنزيل" }, { status: 404 });
    const { client, bucket } = getObjectStorage();
    const url = await getSignedUrl(client, new GetObjectCommand({
      Bucket: bucket, Key: game.objectKey,
      ResponseContentDisposition: `attachment; filename="${slug}-${game.version}.zip"`,
      ResponseContentType: "application/zip"
    }), { expiresIn: 120 });
    return NextResponse.redirect(url, 302);
  } catch (error) {
    console.error("Game download failed:", error);
    return NextResponse.json({ error: "تعذر تجهيز رابط التنزيل" }, { status: 503 });
  }
}
