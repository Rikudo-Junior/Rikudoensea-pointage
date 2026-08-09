import { NextRequest, NextResponse } from "next/server";
import { DASHBOARD_COOKIE_NAME } from "@/lib/config";
import { verifyDashboardToken } from "@/lib/session";
import { getAllPointagesWithUsers } from "@/lib/pointages";
import { FLAG_LABELS } from "@/lib/flagLabels";

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

  const pointages = await getAllPointagesWithUsers();
  const header = [
    "Date",
    "Prenom",
    "Nom",
    "Email",
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
