import { NextRequest, NextResponse } from "next/server";
import {
  ALLOWED_EMAIL_DOMAIN,
  PENDING_VERIFICATION_COOKIE_NAME,
  VERIFICATION_CODE_TTL_SECONDS,
} from "@/lib/config";
import { generateVerificationCode, sendVerificationCode } from "@/lib/email";
import { hashVerificationCode } from "@/lib/codeHash";
import { signPendingVerification } from "@/lib/session";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const prenom = typeof body?.prenom === "string" ? body.prenom.trim() : "";
  const nom = typeof body?.nom === "string" ? body.nom.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!prenom || prenom.length > 60 || !nom || nom.length > 60) {
    return NextResponse.json({ error: "Merci de renseigner un prénom et un nom valides." }, { status: 400 });
  }
  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: "Adresse email invalide." }, { status: 400 });
  }
  const domain = email.split("@")[1];
  if (domain !== ALLOWED_EMAIL_DOMAIN.toLowerCase()) {
    return NextResponse.json(
      { error: `Seules les adresses email professionnelles @${ALLOWED_EMAIL_DOMAIN} sont acceptées.` },
      { status: 400 },
    );
  }

  const code = generateVerificationCode();
  const codeHash = hashVerificationCode(code);
  const pendingToken = await signPendingVerification({ email, prenom, nom, codeHash, attempts: 0 });

  try {
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
