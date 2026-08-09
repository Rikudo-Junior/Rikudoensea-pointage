import { NextRequest, NextResponse } from "next/server";
import {
  ALLOWED_EMAIL_DOMAIN,
  PENDING_VERIFICATION_COOKIE_NAME,
  VERIFICATION_CODE_TTL_SECONDS,
} from "@/lib/config";
import { generateVerificationCode, sendVerificationCode } from "@/lib/email";
import { hashVerificationCode } from "@/lib/codeHash";
import { hashPassword } from "@/lib/password";
import { signPendingVerification } from "@/lib/session";
import { getUserByEmail } from "@/lib/users";
import { isClasse } from "@/lib/classes";
import { checkLockout, recordAttempt } from "@/lib/rateLimit";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const prenom = typeof body?.prenom === "string" ? body.prenom.trim() : "";
  const nom = typeof body?.nom === "string" ? body.nom.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const classe = body?.classe;

  if (!prenom || prenom.length > 60 || !nom || nom.length > 60) {
    return NextResponse.json({ error: "Merci de renseigner un prénom et un nom valides." }, { status: 400 });
  }
  if (!isClasse(classe)) {
    return NextResponse.json({ error: "Merci de sélectionner votre classe." }, { status: 400 });
  }
  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: "Adresse email invalide." }, { status: 400 });
  }
  const domain = email.split("@")[1];
  if (domain !== ALLOWED_EMAIL_DOMAIN.toLowerCase()) {
    return NextResponse.json(
      { error: `Seules les adresses email institutionnelles @${ALLOWED_EMAIL_DOMAIN} sont acceptées.` },
      { status: 400 },
    );
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.` },
      { status: 400 },
    );
  }

  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    return NextResponse.json(
      {
        error: "Cet email est déjà enregistré. Connectez-vous avec votre mot de passe.",
        code: "ALREADY_REGISTERED",
      },
      { status: 409 },
    );
  }

  const rateLimitKey = `register:${email}`;
  const lockout = await checkLockout(rateLimitKey);
  if (lockout.locked) {
    return NextResponse.json(
      {
        error: "Trop de demandes de code pour cette adresse. Réessayez dans quelques minutes.",
        retryAfterSeconds: lockout.retryAfterSeconds,
      },
      { status: 429 },
    );
  }

  const code = generateVerificationCode();
  const codeHash = hashVerificationCode(code);
  const passwordHash = await hashPassword(password);
  const pendingToken = await signPendingVerification({
    email,
    prenom,
    nom,
    classe,
    codeHash,
    passwordHash,
    attempts: 0,
  });

  try {
    await recordAttempt(rateLimitKey);
    await sendVerificationCode(email, code);
  } catch {
    return NextResponse.json(
      { error: "L'envoi du code de vérification a échoué. Réessayez dans un instant." },
      { status: 502 },
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(PENDING_VERIFICATION_COOKIE_NAME, pendingToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: VERIFICATION_CODE_TTL_SECONDS,
    path: "/",
  });
  return res;
}
