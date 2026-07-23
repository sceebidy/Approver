import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // TODO: cek session SSO di sini, redirect ke portal kalau belum login
  return NextResponse.next();
}

export const config = {
  matcher: [],
};