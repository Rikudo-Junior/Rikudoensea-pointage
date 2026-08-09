import { NextRequest, NextResponse } from "next/server";
import {
  PENDING_RESET_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  VERIFICATION_MAX_ATTEMPTS,
} from "@/lib/config";
import { hashVerificationCode } from "@/lib/codeHash";
import { hashPassword } from "@/lib/password";
import { signPendingReset, signSessionToken, verifyPendingReset } from "@/lib/session";
import { getUserByEmail, updatePassword } from "@/lib/users";

const MIN_PASSWORD_LENGTH = 8;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

  const pendingCookie = req.cookies.get(PENDING_RESET_COOKIE_NAME)?.value;
  if (!pendingCookie) {
    return NextResponse.json(
      { error: "Aucune demande en cours ou code expiré. Recommencez." },
      { status: 400 },
    );
  }

  const pending = await verifyPendingReset(pendingCookie);
  if (!pending) {
    return NextResponse.json({ error: "Code expiré. Recommencez." }, { status: 400 });
  }

  if (pending.attempts >= VERIFICATION_MAX_ATTEMPTS) {
    const res = NextResponse.json({ error: "Trop de tentatives incorrectes. Recommencez." }, { status: 429 });
    res.cookies.delete(PENDING_RESET_COOKIE_NAME);
    return res;
  }

  if (hashVerificationCode(code) !== pending.codeHash) {
    const attempts = pending.attempts + 1;
    const remaining = VERIFICATION_MAX_ATTEMPTS - attempts;
    if (remaining <= 0) {
      const res = NextResponse.json({ error: "Trop de tentatives incorrectes. Recommencez." }, { status: 429 });
      res.cookies.delete(PENDING_RESET_COOKIE_NAME);
      return res;
    }
    const res = NextResponse.json(
      { error: `Code incorrect. ${remaining} tentative(s) restante(s).` },
      { status: 400 },
    );
    const refreshedToken = await signPendingReset({ ...pending, attempts });
    res.cookies.set(PENDING_RESET_COOKIE_NAME, refreshedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
    return res;
  }

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `Le nouveau mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.` },
      { status: 400 },
    );
  }

  const user = await getUserByEmail(pending.email);
  if (!user || user.id !== pending.userId) {
    const res = NextResponse.json({ error: "Compte introuvable. Recommencez." }, { status: 400 });
    res.cookies.delete(PENDING_RESET_COOKIE_NAME);
    return res;
  }

  await updatePassword(user.id, await hashPassword(newPassword));

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
  res.cookies.delete(PENDING_RESET_COOKIE_NAME);
  return res;
}
