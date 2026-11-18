import mysql from "mysql2/promise";

const globalForDb = globalThis as typeof globalThis & { gameversePool?: mysql.Pool };

export function getDbPool() {
  const uri = process.env.DATABASE_URL;
  if (!uri) throw new Error("DATABASE_URL is not configured");
  if (!globalForDb.gameversePool) {
    globalForDb.gameversePool = mysql.createPool({
      uri,
      waitForConnections: true,
      connectionLimit: 8,
      queueLimit: 0,
      ssl: {},
    } as mysql.PoolOptions);
  }
  return globalForDb.gameversePool;
}
