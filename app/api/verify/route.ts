import { NextRequest, NextResponse } from "next/server";
import {
  PENDING_VERIFICATION_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  VERIFICATION_MAX_ATTEMPTS,
} from "@/lib/config";
import { hashVerificationCode } from "@/lib/codeHash";
import {
  signPendingVerification,
  signSessionToken,
  verifyPendingVerification,
} from "@/lib/session";
import { createUser, getUserByEmail } from "@/lib/sheets";
import { schoolDateString } from "@/lib/schoolTime";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code.trim() : "";

  const pendingCookie = req.cookies.get(PENDING_VERIFICATION_COOKIE_NAME)?.value;
  if (!pendingCookie) {
    return NextResponse.json(
      { error: "Aucune vérification en cours ou code expiré. Recommencez l'inscription." },
      { status: 400 },
    );
  }

  const pending = await verifyPendingVerification(pendingCookie);
  if (!pending) {
    return NextResponse.json(
      { error: "Code expiré. Recommencez l'inscription." },
      { status: 400 },
    );
  }

  if (pending.attempts >= VERIFICATION_MAX_ATTEMPTS) {
    const res = NextResponse.json(
      { error: "Trop de tentatives incorrectes. Recommencez l'inscription." },
      { status: 429 },
    );
    res.cookies.delete(PENDING_VERIFICATION_COOKIE_NAME);
    return res;
  }

  if (hashVerificationCode(code) !== pending.codeHash) {
    const attempts = pending.attempts + 1;
    const remaining = VERIFICATION_MAX_ATTEMPTS - attempts;
    if (remaining <= 0) {
      const res = NextResponse.json(
        { error: "Trop de tentatives incorrectes. Recommencez l'inscription." },
        { status: 429 },
      );
      res.cookies.delete(PENDING_VERIFICATION_COOKIE_NAME);
      return res;
    }
    const res = NextResponse.json(
      { error: `Code incorrect. ${remaining} tentative(s) restante(s).` },
      { status: 400 },
    );
    const refreshedToken = await signPendingVerification({ ...pending, attempts });
    res.cookies.set(PENDING_VERIFICATION_COOKIE_NAME, refreshedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
    return res;
  }

  const existingUser = await getUserByEmail(pending.email);
  if (!existingUser) {
    await createUser({
      email: pending.email,
      prenom: pending.prenom,
      nom: pending.nom,
      dateInscription: schoolDateString(new Date()),
      statut: "actif",
    });
  }

  const sessionToken = await signSessionToken({
    email: pending.email,
    prenom: existingUser?.prenom ?? pending.prenom,
    nom: existingUser?.nom ?? pending.nom,
  });

  const res = NextResponse.json({
    ok: true,
    prenom: existingUser?.prenom ?? pending.prenom,
    nom: existingUser?.nom ?? pending.nom,
  });
  res.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });
  res.cookies.delete(PENDING_VERIFICATION_COOKIE_NAME);
  return res;
}
