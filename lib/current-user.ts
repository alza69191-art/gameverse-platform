import "server-only";
import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";

export type AuthenticatedUser = {
  id: string;
  email: string;
  displayName: string;
  role: "player" | "developer" | "admin";
  status: string;
};

export async function getAuthenticatedUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  return getSessionUser(request.cookies.get("gv_session")?.value) as Promise<AuthenticatedUser | null>;
}

export function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const normalized = new URL(origin).origin;
    const allowed = new Set([
      new URL(request.url).origin,
      ...(process.env.ALLOWED_APP_ORIGINS ?? "").split(",").map(value => value.trim()).filter(Boolean)
    ]);
    return allowed.has(normalized);
  } catch {
    return false;
  }
}
