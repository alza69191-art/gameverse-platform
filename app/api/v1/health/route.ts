import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REQUIRED_TABLES = [
  "users", "games", "game_versions", "review_events", "game_categories",
  "game_category_map", "catalog_sources", "asset_resources", "developer_applications",
  "game_uploads", "rate_limit_buckets", "user_sessions", "user_favorites",
  "game_reviews", "game_comments", "game_reports", "game_play_history",
  "user_notifications", "admin_audit_logs", "admin_bootstrap_events"
];

export async function GET() {
  try {
    const pool = getDbPool();
    await pool.query("SELECT 1");
    const placeholders = REQUIRED_TABLES.map(() => "?").join(", ");
    const [tableRows] = await pool.execute(
      "SELECT table_name AS tableName FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name IN (" + placeholders + ")",
      REQUIRED_TABLES
    );
    const present = new Set((tableRows as Array<{tableName:string}>).map(row => row.tableName));
    const missingTables = REQUIRED_TABLES.filter(name => !present.has(name));

    let missingColumns: string[] = [];
    if (present.has("user_sessions")) {
      const [columnRows] = await pool.execute(
        "SELECT column_name AS columnName FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'user_sessions' AND column_name = 'last_seen_at'"
      );
      if (!(columnRows as Array<{columnName:string}>).length) missingColumns = ["user_sessions.last_seen_at"];
    }

    const ready = missingTables.length === 0 && missingColumns.length === 0;
    return NextResponse.json({
      status: ready ? "ok" : "degraded",
      service: "gameverse-api",
      database: "connected",
      schema: ready ? "ready" : "migrations_missing",
      ...(ready ? {} : { missingTables, missingColumns })
    }, { status: ready ? 200 : 503, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json({ status: "degraded", service: "gameverse-api", database: "unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
