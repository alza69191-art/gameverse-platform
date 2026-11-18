import { NextRequest, NextResponse } from "next/server";
export function GET(request:NextRequest){return NextResponse.redirect(new URL("/api/v1/search/web"+request.nextUrl.search,request.url),307)}
