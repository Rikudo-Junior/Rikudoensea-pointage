import { NextRequest, NextResponse } from "next/server";
import { DASHBOARD_COOKIE_NAME, DASHBOARD_MAX_AGE_SECONDS } from "@/lib/config";
import { signDashboardToken } from "@/lib/session";
import { verifyDirecteurPassword } from "@/lib/directeur";
import { checkLockout, clearAttempts, recordFailedAttempt } from "@/lib/rateLimit";

const RATE_LIMIT_KEY = "dashboard:directeur";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";

  const lockout = await checkLockout(RATE_LIMIT_KEY);
  if (lockout.locked) {
    return NextResponse.json(
      {
        error: "Trop de tentatives échouées. Réessayez dans quelques minutes.",
        retryAfterSeconds: lockout.retryAfterSeconds,
      },
      { status: 429 },
    );
  }

  const valid = await verifyDirecteurPassword(password);
  if (!valid) {
    await recordFailedAttempt(RATE_LIMIT_KEY);
    return NextResponse.json({ error: "Mot de passe incorrect." }, { status: 401 });
  }
  await clearAttempts(RATE_LIMIT_KEY);

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
