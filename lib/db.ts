import mysql from "mysql2/promise";

const globalForDb = globalThis as typeof globalThis & { gameversePool?: mysql.Pool };

export function getDbPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not configured");
  if (!globalForDb.gameversePool) {
    const url = new URL(connectionString);
    globalForDb.gameversePool = mysql.createPool({
      host: url.hostname,
      port: Number(url.port || 4000),
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: decodeURIComponent(url.pathname.replace(/^\//, "")),
      waitForConnections: true,
      connectionLimit: 8,
      queueLimit: 0,
      ssl: { minVersion: "TLSv1.2" },
    });
  }
  return globalForDb.gameversePool;
}
