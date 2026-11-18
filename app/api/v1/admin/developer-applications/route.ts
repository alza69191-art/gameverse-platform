import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, isSameOrigin } from "@/lib/current-user";
import { getDbPool } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const admin = await getAuthenticatedUser(request);
    if (!admin || admin.role !== "admin") return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    const pool = getDbPool();
    const [rows] = await pool.query(
      "SELECT a.id, a.user_id AS userId, u.email, u.display_name AS displayName, a.studio_name AS studioName, a.contact_email AS contactEmail, a.portfolio_url AS portfolioUrl, a.description, a.status, a.created_at AS createdAt FROM developer_applications a JOIN users u ON u.id = a.user_id WHERE a.status = 'pending' ORDER BY a.created_at ASC LIMIT 100"
    );
    return NextResponse.json({ applications: rows }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Developer application queue failed:", error);
    return NextResponse.json({ error: "تعذر تحميل الطلبات" }, { status: 500 });
  }
}
