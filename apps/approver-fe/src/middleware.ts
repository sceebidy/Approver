import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("approver_session")?.value;
  const isSsoVerifyRoute = request.nextUrl.pathname.startsWith("/sso/verify");

  if (!token && !isSsoVerifyRoute) {
    const portalUrl = process.env.NEXT_PUBLIC_PORTAL_LOGIN_URL || "https://portal.inl.co.id";
    // Redirect to Portal if no token is found
    return NextResponse.redirect(new URL(portalUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};