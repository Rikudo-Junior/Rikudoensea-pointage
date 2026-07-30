import { NextRequest, NextResponse } from "next/server";
import { DASHBOARD_COOKIE_NAME } from "@/lib/config";
import { verifyDashboardToken } from "@/lib/session";

export async function proxy(req: NextRequest) {
  const cookie = req.cookies.get(DASHBOARD_COOKIE_NAME)?.value;
  const valid = cookie ? await verifyDashboardToken(cookie) : false;

  if (!valid) {
    const loginUrl = new URL("/dashboard/login", req.url);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/((?!login).*)"],
};
