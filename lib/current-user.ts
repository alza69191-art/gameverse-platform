import "server-only";
import { NextRequest } from "next/server";
import { getDbPool } from "@/lib/db";
import { readSessionToken, sessionCookieName } from "@/lib/auth";

export type AuthenticatedUser = {
  id: string;
  email: string;
  displayName: string;
  role: "player" | "developer" | "admin";
  status: string;
};

export async function getAuthenticatedUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  const session = readSessionToken(request.cookies.get(sessionCookieName())?.value);
  if (!session) return null;
  const pool = getDbPool();
  const [rows] = await pool.execute(
    "SELECT id, email, display_name, role, status FROM users WHERE id = ? LIMIT 1",
    [session.sub]
  );
  const user = (rows as Array<{id:number|bigint;email:string;display_name:string;role:AuthenticatedUser["role"];status:string}>)[0];
  if (!user || user.status !== "active") return null;
  return { id: String(user.id), email: user.email, displayName: user.display_name, role: user.role, status: user.status };
}

export function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}
