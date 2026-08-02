import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/config";
import { verifySessionToken } from "@/lib/session";
import { getUserByEmail, updatePassword } from "@/lib/users";
import { hashPassword, verifyPassword } from "@/lib/password";

const MIN_PASSWORD_LENGTH = 8;

export async function POST(req: NextRequest) {
  const cookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = cookie ? await verifySessionToken(cookie) : null;
  if (!session) {
    return NextResponse.json({ error: "Session expirée. Merci de vous reconnecter." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `Le nouveau mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.` },
      { status: 400 },
    );
  }

  const user = await getUserByEmail(session.email);
  if (!user || !(await verifyPassword(currentPassword, user.passwordHash))) {
    return NextResponse.json({ error: "Mot de passe actuel incorrect." }, { status: 401 });
  }

  await updatePassword(user.id, await hashPassword(newPassword));
  return NextResponse.json({ ok: true });
}
