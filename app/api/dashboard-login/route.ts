import { NextRequest, NextResponse } from "next/server";
import { DASHBOARD_COOKIE_NAME, DASHBOARD_MAX_AGE_SECONDS } from "@/lib/config";
import { signDashboardToken } from "@/lib/session";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";

  const expected = process.env.DASHBOARD_PASSWORD;
  if (!expected || password !== expected) {
    return NextResponse.json({ error: "Mot de passe incorrect." }, { status: 401 });
  }

  const token = await signDashboardToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(DASHBOARD_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: DASHBOARD_MAX_AGE_SECONDS,
    path: "/",
  });
  return res;
}
