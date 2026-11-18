import mysql from "mysql2/promise";

const email = String(process.argv[2] ?? "").trim().toLowerCase();
const confirm = String(process.env.BOOTSTRAP_ADMIN_CONFIRM_EMAIL ?? "").trim().toLowerCase();
const raw = process.env.DATABASE_URL;
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  throw new Error("Usage: DATABASE_URL=... BOOTSTRAP_ADMIN_CONFIRM_EMAIL=the-same-email node scripts/bootstrap-admin.mjs email@example.com");
}
if (!confirm || confirm !== email) throw new Error("Confirmation email must exactly match the target email.");
if (!raw) throw new Error("DATABASE_URL is required.");

const url = new URL(raw);
const connection = await mysql.createConnection({
  host: url.hostname,
  port: Number(url.port || 4000),
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: decodeURIComponent(url.pathname.replace(/^\//, "")),
  ssl: { minVersion: "TLSv1.2" }
});
try {
  await connection.beginTransaction();
  const [admins] = await connection.execute("SELECT COUNT(*) AS total FROM users WHERE role = 'admin' AND status = 'active'");
  if (Number(admins[0].total) > 0) throw new Error("An active administrator already exists; bootstrap is disabled.");
  const [rows] = await connection.execute("SELECT id, status FROM users WHERE email = ? FOR UPDATE", [email]);
  const target = rows[0];
  if (!target || target.status !== "active") throw new Error("Create an active player account first, then run this command.");
  await connection.execute("UPDATE users SET role = 'admin' WHERE id = ? AND role = 'player'", [target.id]);
  await connection.execute("INSERT INTO admin_bootstrap_events (target_user_id, target_email, source) VALUES (?, ?, 'manual_cli')", [target.id, email]);
  await connection.commit();
  console.log("First administrator role assigned successfully to the existing account:", email);
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}
