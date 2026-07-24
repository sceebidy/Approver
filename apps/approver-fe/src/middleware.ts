import { NextResponse } from "next/server";

export function middleware() {
  // TODO: cek session SSO di sini, redirect ke portal kalau belum login
  return NextResponse.next();
}

export const config = {
  matcher: [],
};