import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/current-user";
import { getDbPool } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const admin = await getAuthenticatedUser(request);
    if (!admin || admin.role !== "admin") return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    const [rows] = await getDbPool().execute(
      "SELECT l.id, l.action, l.entity_type AS entityType, l.entity_id AS entityId, l.details, l.created_at AS createdAt, u.display_name AS actorName FROM admin_audit_logs l JOIN users u ON u.id = l.actor_id ORDER BY l.created_at DESC LIMIT 100"
    );
    return NextResponse.json({ logs: rows }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Admin audit log lookup failed:", error);
    return NextResponse.json({ error: "تعذر تحميل سجل الإدارة" }, { status: 500 });
  }
}
