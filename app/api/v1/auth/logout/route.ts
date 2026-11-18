import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";
import { isSameOrigin } from "@/lib/current-user";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "طلب غير مسموح" }, { status: 403 });
  const response = NextResponse.json({ success: true });
  response.headers.set("Set-Cookie", clearSessionCookie());
  response.headers.set("Cache-Control", "no-store");
  return response;
}
