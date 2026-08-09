import { NextRequest, NextResponse } from "next/server";
import { sendWeeklyDigest } from "@/lib/email";
import { getAllUsers } from "@/lib/users";
import { getAllPointagesWithUsers } from "@/lib/pointages";
import { getStageDates } from "@/lib/directeur";
import { computeInternStats } from "@/lib/internStats";
import { now } from "@/lib/clock";
import { schoolDateString } from "@/lib/schoolTime";

// Déclenché par Vercel Cron (voir vercel.json) — Vercel ajoute automatiquement
// `Authorization: Bearer $CRON_SECRET` sur ces requêtes quand la variable
// d'environnement CRON_SECRET est définie sur le projet.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const digestEmail = process.env.DIRECTOR_DIGEST_EMAIL;
  if (!digestEmail) {
    return NextResponse.json({ skipped: true, reason: "DIRECTOR_DIGEST_EMAIL non configuré." });
  }

  const today = schoolDateString(now());
  const sevenDaysAgo = new Date(now());
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);
  const weekStart = schoolDateString(sevenDaysAgo);

  const [users, allPointages, stageDates] = await Promise.all([
    getAllUsers(),
    getAllPointagesWithUsers(),
    getStageDates(),
  ]);

  const periodDebut = weekStart > stageDates.debut ? weekStart : stageDates.debut;
  const periodFin = today < stageDates.fin ? today : stageDates.fin;

  const pointagesByEmail = new Map<string, typeof allPointages>();
  for (const p of allPointages) {
    const list = pointagesByEmail.get(p.email) ?? [];
    list.push(p);
    pointagesByEmail.set(p.email, list);
  }

  const entries = users
    .filter((u) => u.statut === "actif")
    .map((u) => {
      const userPointages = (pointagesByEmail.get(u.email) ?? []).filter(
        (p) => p.date >= periodDebut && p.date <= periodFin,
      );
      const stats = computeInternStats(userPointages, periodFin, { debut: periodDebut, fin: periodFin });
      return { prenom: u.prenom, nom: u.nom, joursAbsence: stats.joursAbsence, retards: stats.retards };
    })
    .filter((e) => e.joursAbsence > 0 || e.retards > 0)
    .sort((a, b) => b.joursAbsence + b.retards - (a.joursAbsence + a.retards));

  await sendWeeklyDigest(digestEmail, { debut: periodDebut, fin: periodFin }, entries);

  return NextResponse.json({ ok: true, sent: entries.length });
}
