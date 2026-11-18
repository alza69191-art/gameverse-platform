import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/current-user";
import { getDbPool } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const admin = await getAuthenticatedUser(request);
    if (!admin || admin.role !== "admin") return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    const q = (request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 100);
    const status = request.nextUrl.searchParams.get("status");
    const allowedStatus = ["active","suspended","pending"].includes(status ?? "") ? status : null;
    const search = `%${q}%`;
    const [rows] = await getDbPool().execute(
      "SELECT id, email, display_name AS displayName, role, status, created_at AS createdAt FROM users WHERE (? = '' OR email LIKE ? OR display_name LIKE ?) AND (? IS NULL OR status = ?) ORDER BY created_at DESC LIMIT 200",
      [q, search, search, allowedStatus, allowedStatus]
    );
    return NextResponse.json({ users: rows }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Admin users lookup failed:", error);
    return NextResponse.json({ error: "تعذر تحميل المستخدمين" }, { status: 500 });
  }
}
