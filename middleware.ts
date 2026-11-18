import { NextRequest, NextResponse } from "next/server";

const METHODS = "GET,POST,PUT,PATCH,DELETE,OPTIONS";
const HEADERS = "Content-Type,Authorization";
const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function allowedOrigins(request: NextRequest) {
  return new Set([
    request.nextUrl.origin,
    ...(process.env.ALLOWED_APP_ORIGINS ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  ]);
}

export function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/api/")) return NextResponse.next();

  const origin = request.headers.get("origin");
  const allowed = allowedOrigins(request);
  if (MUTATING.has(request.method) && (!origin || !allowed.has(origin))) {
    return NextResponse.json({ error: "Origin not allowed" }, { status: 403 });
  }
  if (origin && !allowed.has(origin)) {
    return NextResponse.json({ error: "Origin not allowed" }, { status: 403 });
  }

  if (request.method === "OPTIONS") {
    if (!origin || !allowed.has(origin)) return new NextResponse(null, { status: 403 });
    const response = new NextResponse(null, { status: 204 });
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set("Access-Control-Allow-Methods", METHODS);
    response.headers.set("Access-Control-Allow-Headers", HEADERS);
    response.headers.set("Access-Control-Max-Age", "600");
    response.headers.set("Vary", "Origin");
    return response;
  }

  const response = NextResponse.next();
  if (origin && allowed.has(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.append("Vary", "Origin");
  }
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return response;
}

export const config = { matcher: ["/api/:path*"] };
