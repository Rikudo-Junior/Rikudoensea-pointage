import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/lib/config";
import { verifyPassword } from "@/lib/password";
import { signSessionToken } from "@/lib/session";
import { getUserByEmail } from "@/lib/users";

const GENERIC_ERROR = "Email ou mot de passe incorrect.";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  const user = await getUserByEmail(email);
  if (!user || user.statut === "desactive") {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  const passwordValid = await verifyPassword(password, user.passwordHash);
  if (!passwordValid) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

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
