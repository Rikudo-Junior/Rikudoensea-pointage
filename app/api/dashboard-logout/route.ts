import { NextResponse } from "next/server";
import { DASHBOARD_COOKIE_NAME } from "@/lib/config";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(DASHBOARD_COOKIE_NAME);
  return res;
}
