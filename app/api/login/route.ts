import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/lib/config";
import { verifyPassword } from "@/lib/password";
import { signSessionToken } from "@/lib/session";
import { getUserByEmail } from "@/lib/users";
import { checkLockout, clearAttempts, recordAttempt } from "@/lib/rateLimit";

const GENERIC_ERROR = "Email ou mot de passe incorrect.";
const LOCKED_ERROR = "Trop de tentatives échouées. Réessayez dans quelques minutes.";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  const rateLimitKey = `login:${email}`;
  const lockout = await checkLockout(rateLimitKey);
  if (lockout.locked) {
    return NextResponse.json(
      { error: LOCKED_ERROR, retryAfterSeconds: lockout.retryAfterSeconds },
      { status: 429 },
    );
  }

  const user = await getUserByEmail(email);
  if (!user || user.statut === "desactive") {
    await recordAttempt(rateLimitKey);
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  const passwordValid = await verifyPassword(password, user.passwordHash);
  if (!passwordValid) {
    await recordAttempt(rateLimitKey);
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }
  await clearAttempts(rateLimitKey);

  const sessionToken = await signSessionToken({
    userId: user.id,
    email: user.email,
    prenom: user.prenom,
    nom: user.nom,
  });

  const res = NextResponse.json({ ok: true, prenom: user.prenom, nom: user.nom });
  res.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });
  return res;
}
