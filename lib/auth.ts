import "server-only";
import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { getDbPool } from "@/lib/db";

function deriveScrypt(password: string, salt: Buffer, keyLength: number, options: { N: number; r: number; p: number; maxmem: number }) {
  return new Promise<Buffer>((resolve, reject) => {
    scryptCallback(password, salt, keyLength, options, (error, derived) => {
      if (error) reject(error);
      else resolve(derived as Buffer);
    });
  });
}
const SESSION_COOKIE = "gv_session";
const SESSION_SECONDS = 60 * 60 * 24 * 7;
const SCRYPT_N = 1 << 17;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_MAXMEM = 256 * 1024 * 1024;

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const derived = (await deriveScrypt(password, salt, 64, {
    N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P, maxmem: SCRYPT_MAXMEM
  })) as Buffer;
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt.toString("base64url")}$${derived.toString("base64url")}`;
}

export async function verifyPassword(password: string, stored: string) {
  try {
    let n = 16384, r = 8, p = 1, saltText = "", hashText = "";
    if (stored.startsWith("scrypt$")) {
      const parts = stored.split("$");
      if (parts.length !== 6) return false;
      n = Number(parts[1]); r = Number(parts[2]); p = Number(parts[3]);
      saltText = parts[4]; hashText = parts[5];
    } else {
      // Backward compatibility for hashes created before the parameter upgrade.
      const parts = stored.split(":");
      if (parts.length !== 3 || parts[0] !== "scrypt") return false;
      saltText = parts[1]; hashText = parts[2];
    }
    if (!Number.isInteger(n) || n < 16384 || n > (1 << 18) || !Number.isInteger(r) || r < 1 || r > 16 || !Number.isInteger(p) || p < 1 || p > 4)
      return false;
    const expected = Buffer.from(hashText, "base64url");
    const salt = Buffer.from(saltText, "base64url");
    if (expected.length !== 64 || salt.length !== 16) return false;
    const actual = (await deriveScrypt(password, salt, expected.length, {
      N: n, r, p, maxmem: SCRYPT_MAXMEM
    })) as Buffer;
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export async function createSessionToken(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const pool = getDbPool();
  await pool.execute(
    "INSERT INTO user_sessions (token_hash, user_id, expires_at) VALUES (?, ?, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL ? SECOND))",
    [tokenHash, userId, SESSION_SECONDS]
  );
  await pool.execute(
    "DELETE FROM user_sessions WHERE expires_at < CURRENT_TIMESTAMP OR revoked_at < DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 30 DAY)"
  );
  return token;
}

export async function getSessionUser(token?: string | null) {
  if (!token || token.length > 100) return null;
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const pool = getDbPool();
  const [rows] = await pool.execute(
    "SELECT u.id, u.email, u.display_name, u.role, u.status, s.token_hash FROM user_sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.revoked_at IS NULL AND s.expires_at > CURRENT_TIMESTAMP AND (s.last_seen_at IS NULL OR s.last_seen_at > DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 24 HOUR)) AND u.status = 'active' LIMIT 1",
    [tokenHash]
  );
  const user = (rows as Array<{id:number|bigint;email:string;display_name:string;role:"player"|"developer"|"admin";status:string;token_hash:string}>)[0];
  if (!user) return null;
  await pool.execute(
    "UPDATE user_sessions SET last_seen_at = CURRENT_TIMESTAMP WHERE token_hash = ? AND (last_seen_at IS NULL OR last_seen_at < DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 5 MINUTE))",
    [tokenHash]
  );
  return { id: String(user.id), email: user.email, displayName: user.display_name, role: user.role, status: user.status };
}

export async function revokeSession(token?: string | null) {
  if (!token || token.length > 100) return;
  const tokenHash = createHash("sha256").update(token).digest("hex");
  await getDbPool().execute(
    "UPDATE user_sessions SET revoked_at = CURRENT_TIMESTAMP WHERE token_hash = ? AND revoked_at IS NULL",
    [tokenHash]
  );
}

export function sessionCookie(token: string) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_SECONDS}${secure}`;
}

export function clearSessionCookie() {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

export function sessionCookieName() {
  return SESSION_COOKIE;
}
