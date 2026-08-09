import { NextRequest, NextResponse } from "next/server";
import { DASHBOARD_COOKIE_NAME } from "@/lib/config";
import { verifyDashboardToken } from "@/lib/session";
import { getAllPointagesWithUsers } from "@/lib/pointages";
import { FLAG_LABELS } from "@/lib/flagLabels";
import { isClasse } from "@/lib/classes";

function csvEscape(value: string): string {
  // Neutralise l'injection de formule (=, +, -, @ en tête sont interprétés comme des
  // formules par Excel/Sheets à l'ouverture) sur les champs saisis par les stagiaires
  // (prenom, nom, email) avant l'échappement CSV standard.
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
  if (/[",\n]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get(DASHBOARD_COOKIE_NAME)?.value;
  const valid = cookie ? await verifyDashboardToken(cookie) : false;
  if (!valid) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const dateDebut = searchParams.get("dateDebut");
  const dateFin = searchParams.get("dateFin");
  const classeParam = searchParams.get("classe");
  const classe = isClasse(classeParam) ? classeParam : null;
  const flaggedOnly = searchParams.get("flaggedOnly") === "true";

  const allPointages = await getAllPointagesWithUsers();
  const pointages = allPointages.filter((p) => {
    if (dateDebut && p.date < dateDebut) return false;
    if (dateFin && p.date > dateFin) return false;
    if (classe && p.classe !== classe) return false;
    if (flaggedOnly && p.flags.length === 0) return false;
    return true;
  });

  const header = [
    "Date",
    "Prenom",
    "Nom",
    "Email",
    "Classe",
    "HeureArrivee",
    "HeureDepart",
    "DureeMinutes",
    "Flags",
  ];
  const rows = pointages.map((p) => [
    p.date,
    p.prenom,
    p.nom,
    p.email,
    p.classe,
    p.heureArrivee ?? "",
    p.heureDepart ?? "",
    p.dureeMinutes?.toString() ?? "",
    p.flags.map((f) => FLAG_LABELS[f].label).join(" ; "),
  ]);

  const csv = [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
  const withBom = "﻿" + csv; // BOM pour un import Excel correct des accents

  return new NextResponse(withBom, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pointages_ensea_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
