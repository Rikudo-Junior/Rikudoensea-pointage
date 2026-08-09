import { NextRequest, NextResponse } from "next/server";
import { DASHBOARD_COOKIE_NAME, SESSION_COOKIE_NAME } from "@/lib/config";
import { verifyDashboardToken, verifySessionToken } from "@/lib/session";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/mon-suivi")) {
    const cookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = cookie ? await verifySessionToken(cookie) : null;
    if (!session) {
      return NextResponse.redirect(new URL("/pointage", req.url));
    }
    return NextResponse.next();
  }

  const cookie = req.cookies.get(DASHBOARD_COOKIE_NAME)?.value;
  const valid = cookie ? await verifyDashboardToken(cookie) : false;

  if (!valid) {
    const loginUrl = new URL("/dashboard/login", req.url);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/dashboard/((?!login).*)", "/mon-suivi/:path*"],
};
