import { NextRequest, NextResponse } from "next/server";
import { PENDING_RESET_COOKIE_NAME, VERIFICATION_CODE_TTL_SECONDS } from "@/lib/config";
import { generateVerificationCode, sendPasswordResetCode } from "@/lib/email";
import { hashVerificationCode } from "@/lib/codeHash";
import { signPendingReset } from "@/lib/session";
import { getUserByEmail } from "@/lib/users";
import { checkLockout, recordAttempt } from "@/lib/rateLimit";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GENERIC_OK = { ok: true, message: "Si un compte existe pour cette adresse, un code a été envoyé." };

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: "Adresse email invalide." }, { status: 400 });
  }

  const rateLimitKey = `reset:${email}`;
  const lockout = await checkLockout(rateLimitKey);
  if (lockout.locked) {
    return NextResponse.json(
      {
        error: "Trop de demandes pour cette adresse. Réessayez dans quelques minutes.",
        retryAfterSeconds: lockout.retryAfterSeconds,
      },
      { status: 429 },
    );
  }

  const user = await getUserByEmail(email);
  if (!user || user.statut === "desactive") {
    // Réponse identique, que le compte existe ou non : évite de révéler quels emails
    // sont enregistrés.
    return NextResponse.json(GENERIC_OK);
  }

  const code = generateVerificationCode();
  const codeHash = hashVerificationCode(code);
  const pendingToken = await signPendingReset({
    email: user.email,
    userId: user.id,
    codeHash,
    attempts: 0,
  });

  try {
    await recordAttempt(rateLimitKey);
    await sendPasswordResetCode(user.email, code);
  } catch {
    return NextResponse.json(
      { error: "L'envoi du code a échoué. Réessayez dans un instant." },
      { status: 502 },
    );
  }

  const res = NextResponse.json(GENERIC_OK);
  res.cookies.set(PENDING_RESET_COOKIE_NAME, pendingToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: VERIFICATION_CODE_TTL_SECONDS,
    path: "/",
  });
  return res;
}
