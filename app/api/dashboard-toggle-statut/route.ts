import { NextRequest, NextResponse } from "next/server";
import { DASHBOARD_COOKIE_NAME } from "@/lib/config";
import { verifyDashboardToken } from "@/lib/session";
import { setUserStatut } from "@/lib/users";

export async function POST(req: NextRequest) {
  const cookie = req.cookies.get(DASHBOARD_COOKIE_NAME)?.value;
  const authorized = cookie ? await verifyDashboardToken(cookie) : false;
  if (!authorized) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email : "";
  const statut = body?.statut === "desactive" ? "desactive" : body?.statut === "actif" ? "actif" : null;

  if (!email || !statut) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  await setUserStatut(email, statut);

  return NextResponse.json({ ok: true, statut });
}
