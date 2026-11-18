import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const pool = getDbPool();
    await pool.query("SELECT 1");
    return NextResponse.json({ status: "ok", service: "gameverse-api", database: "connected" });
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json({ status: "degraded", service: "gameverse-api", database: "unavailable" }, { status: 503 });
  }
}
