import { createHash } from "node:crypto";
import { createWriteStream } from "node:fs";
import { unlink } from "node:fs/promises";
import { pipeline } from "node:stream/promises";
import { promisify } from "node:util";
import { execFile as execFileCallback } from "node:child_process";
import mysql from "mysql2/promise";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const execFile = promisify(execFileCallback);
const required = ["DATABASE_URL","R2_ENDPOINT","R2_ACCESS_KEY_ID","R2_SECRET_ACCESS_KEY","R2_BUCKET","GAMEVERSE_SCAN_WEBHOOK_SECRET"];
for (const key of required) if (!process.env[key]) throw new Error(`Missing required environment variable: ${key}`);

const dbUrl = new URL(process.env.DATABASE_URL);
const pool = mysql.createPool({
  host: dbUrl.hostname, port: Number(dbUrl.port || 4000),
  user: decodeURIComponent(dbUrl.username), password: decodeURIComponent(dbUrl.password),
  database: decodeURIComponent(dbUrl.pathname.replace(/^\//, "")),
  waitForConnections: true, connectionLimit: 3, queueLimit: 0,
  ssl: { minVersion: "TLSv1.2" }
});
const s3 = new S3Client({
  region: "auto", endpoint: process.env.R2_ENDPOINT,
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY },
  forcePathStyle: true
});
const bucket = process.env.R2_BUCKET;
const apiBase = (process.env.GAMEVERSE_API_URL || "https://gameverse-platform-drdc.onrender.com").replace(/\/$/, "");

async function report(id, status) {
  const response = await fetch(`${apiBase}/api/v1/internal/scanner-result`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-scanner-token": process.env.GAMEVERSE_SCAN_WEBHOOK_SECRET },
    body: JSON.stringify({ uploadId: id, status })
  });
  if (!response.ok) throw new Error(`Scanner callback rejected with HTTP ${response.status}`);
}

async function main() {
  // Recover claims abandoned by a cancelled or expired runner.
  await pool.execute(
    "UPDATE game_uploads SET scan_status = 'pending', scan_started_at = NULL WHERE scan_status = 'scanning' AND scan_started_at < DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 90 MINUTE)"
  );
  const [rows] = await pool.execute(
    "SELECT id, object_key, size_bytes FROM game_uploads WHERE upload_status = 'uploaded' AND scan_status = 'pending' ORDER BY created_at ASC LIMIT 5"
  );
  let failures = 0;
  for (const row of rows) {
    const id = String(row.id);
    const [claim] = await pool.execute(
      "UPDATE game_uploads SET scan_status = 'scanning', scan_started_at = CURRENT_TIMESTAMP WHERE id = ? AND upload_status = 'uploaded' AND scan_status = 'pending'",
      [id]
    );
    if (claim.affectedRows !== 1) continue;

    const path = `/tmp/gameverse-${id}.zip`;
    try {
      const object = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: row.object_key }));
      if (Number(object.ContentLength) !== Number(row.size_bytes) || !object.Body)
        throw new Error("Object size mismatch or empty object");
      await pipeline(object.Body, createWriteStream(path));

      const { readFile } = await import("node:fs/promises");
      const handle = await readFile(path);
      const isZip = handle.length >= 4 &&
        ((handle[0] === 0x50 && handle[1] === 0x4b && handle[2] === 0x03 && handle[3] === 0x04) ||
         (handle[0] === 0x50 && handle[1] === 0x4b && handle[2] === 0x05 && handle[3] === 0x06) ||
         (handle[0] === 0x50 && handle[1] === 0x4b && handle[2] === 0x07 && handle[3] === 0x08));
      if (!isZip) throw new Error("ZIP signature check failed");
      const digest = createHash("sha256").update(handle).digest("hex");
      await pool.execute("UPDATE game_uploads SET sha256 = ? WHERE id = ?", [digest, id]);

      await execFile("python3", ["scripts/validate-archive.py", path], { timeout: 180000, maxBuffer: 1024 * 1024 });
      let verdict = "error";
      try {
        await execFile("clamscan", [
          "--no-summary", "--alert-exceeds-max", "--alert-encrypted",
          "--max-filesize=256M", "--max-scansize=1G", "--max-recursion=10",
          "--max-files=10000", "--max-scantime=300000", path
        ], { timeout: 360000, maxBuffer: 2 * 1024 * 1024 });
        verdict = "clean";
      } catch (scanError) {
        const code = Number(scanError?.code);
        const output = `${scanError?.stdout || ""}\n${scanError?.stderr || ""}`;
        if (code === 1 || output.includes("Heuristics.Limits.Exceeded") || output.includes("Encrypted.Archive"))
          verdict = "infected";
        else
          verdict = "error";
      }
      await report(id, verdict);
      console.log(`Upload ${id}: ${verdict}`);
      if (verdict === "error") failures++;
    } catch (error) {
      console.error(`Upload ${id} scan failed:`, error instanceof Error ? error.message : "unknown error");
      try { await report(id, "error"); } catch { failures++; }
      failures++;
    } finally {
      await unlink(path).catch(() => {});
    }
  }
  console.log(`Scanner checked ${rows.length} queued item(s)`);
  if (failures) process.exitCode = 1;
}

try {
  await main();
} finally {
  await pool.end();
  s3.destroy();
}
