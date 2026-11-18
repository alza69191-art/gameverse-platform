import { readFile } from "node:fs/promises";
import mysql from "mysql2/promise";

const raw = process.env.GAMEVERSE_DATABASE_URL;
if (!raw) throw new Error("Missing GitHub Actions secret GAMEVERSE_DATABASE_URL.");
const url = new URL(raw);
const connection = await mysql.createConnection({
  host: url.hostname,
  port: Number(url.port || 4000),
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: decodeURIComponent(url.pathname.replace(/^\\//, "")),
  ssl: { minVersion: "TLSv1.2" },
  multipleStatements: true
});
const files = [
  "database/schema.sql",
  "database/migrations/002_developer_uploads.sql",
  "database/migrations/003_rate_limits.sql",
  "database/migrations/004_community_moderation.sql",
  "database/migrations/005_revocable_sessions.sql",
  "database/migrations/006_admin_bootstrap_audit.sql",
  "database/migrations/007_web_search_index.sql"
];
try {
  for (const file of files) {
    const sql = await readFile(file, "utf8");
    await connection.query(sql);
    console.log("Applied:", file);
  }
  const [sessionColumns] = await connection.query(
    "SELECT column_name FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'user_sessions' AND column_name = 'last_seen_at'"
  );
  if (!sessionColumns.length) {
    await connection.query("ALTER TABLE user_sessions ADD COLUMN last_seen_at TIMESTAMP NULL AFTER revoked_at");
    console.log("Added missing column: user_sessions.last_seen_at");
  }

  const required = [
    "users", "games", "game_versions", "review_events", "game_categories",
    "game_category_map", "catalog_sources", "asset_resources", "developer_applications",
    "game_uploads", "rate_limit_buckets", "user_sessions", "user_favorites",
    "game_reviews", "game_comments", "game_reports", "game_play_history",
    "user_notifications", "admin_audit_logs", "admin_bootstrap_events",
    "web_sites", "web_pages", "web_crawl_queue"
  ];
  const [rows] = await connection.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE()"
  );
  const existing = new Set(rows.map(row => row.TABLE_NAME ?? row.table_name));
  const missing = required.filter(name => !existing.has(name));
  if (missing.length) throw new Error("Migration verification failed; missing tables: " + missing.join(", "));
  console.log("Migration verification passed. Required tables:", required.length);
} finally {
  await connection.end();
}
