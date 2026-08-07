import { NextRequest, NextResponse } from "next/server";
import { DASHBOARD_COOKIE_NAME } from "@/lib/config";
import { verifyDashboardToken } from "@/lib/session";
import { setStageDates } from "@/lib/directeur";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(req: NextRequest) {
  const cookie = req.cookies.get(DASHBOARD_COOKIE_NAME)?.value;
  const authorized = cookie ? await verifyDashboardToken(cookie) : false;
  if (!authorized) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const debut = typeof body?.debut === "string" ? body.debut : "";
  const fin = typeof body?.fin === "string" ? body.fin : "";

  if (!DATE_RE.test(debut) || !DATE_RE.test(fin)) {
    return NextResponse.json({ error: "Dates invalides." }, { status: 400 });
  }
  if (debut > fin) {
    return NextResponse.json(
      { error: "La date de début doit être antérieure ou égale à la date de fin." },
      { status: 400 },
    );
  }

  await setStageDates(debut, fin);

  return NextResponse.json({ ok: true, debut, fin });
}
