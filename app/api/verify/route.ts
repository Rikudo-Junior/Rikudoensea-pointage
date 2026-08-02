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
import { createUser, getUserByEmail } from "@/lib/users";
import { syncUserToSheets } from "@/lib/sheetsSync";
import { schoolDateString } from "@/lib/schoolTime";
import type { Classe } from "@/lib/classes";

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

  let user = await getUserByEmail(pending.email);
  if (!user) {
    user = await createUser({
      email: pending.email,
      prenom: pending.prenom,
      nom: pending.nom,
      passwordHash: pending.passwordHash,
      classe: pending.classe as Classe,
    });
    await syncUserToSheets({
      email: user.email,
      prenom: user.prenom,
      nom: user.nom,
      dateInscription: schoolDateString(new Date()),
      statut: "actif",
    });
  }

  const sessionToken = await signSessionToken({
    userId: user.id,
    email: user.email,
    prenom: user.prenom,
    nom: user.nom,
  });

  const res = NextResponse.json({
    ok: true,
    prenom: user.prenom,
    nom: user.nom,
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
