"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FlagList } from "@/components/StatusBadge";
import { RapportCell } from "@/components/RapportCell";
import type { PointageRecord } from "@/lib/sheets";

function formatDuree(minutes: number | null): string {
  if (minutes === null) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h${String(m).padStart(2, "0")}`;
}

export function DashboardTable({
  pointages,
  nominalMinutes,
}: {
  pointages: PointageRecord[];
  nominalMinutes: number;
}) {
  const [search, setSearch] = useState("");
  const [flaggedOnly, setFlaggedOnly] = useState(false);

  const sorted = useMemo(
    () =>
      [...pointages].sort((a, b) => {
        if (a.date !== b.date) return a.date < b.date ? 1 : -1;
        return `${a.nom}${a.prenom}`.localeCompare(`${b.nom}${b.prenom}`);
      }),
    [pointages],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sorted.filter((p) => {
      if (flaggedOnly && p.flags.length === 0) return false;
      if (!q) return true;
      return (
        p.prenom.toLowerCase().includes(q) ||
        p.nom.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.date.includes(q)
      );
    });
  }, [sorted, search, flaggedOnly]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Rechercher (nom, email, date)…"
            className="w-64"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setFlaggedOnly((v) => !v)}
            className={`cursor-pointer rounded-md border px-3 py-2 text-sm transition-colors ${
              flaggedOnly
                ? "border-secondary bg-secondary text-secondary-foreground"
                : "border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            À vérifier uniquement
          </button>
        </div>
        <div className="flex items-center gap-2">
          <a href="/api/dashboard-export">
            <Button variant="outline" className="cursor-pointer">
              Exporter (CSV)
            </Button>
          </a>
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Stagiaire</TableHead>
              <TableHead>Arrivée</TableHead>
              <TableHead>Départ</TableHead>
              <TableHead>Durée</TableHead>
              <TableHead>À vérifier</TableHead>
              <TableHead>Rapport</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  Aucun pointage.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((p) => (
              <TableRow key={`${p.email}-${p.date}`}>
                <TableCell className="whitespace-nowrap">{p.date}</TableCell>
                <TableCell className="whitespace-nowrap font-medium">
                  {p.prenom} {p.nom}
                </TableCell>
                <TableCell>{p.heureArrivee ? p.heureArrivee.slice(0, 5) : "—"}</TableCell>
                <TableCell>{p.heureDepart ? p.heureDepart.slice(0, 5) : "En cours"}</TableCell>
                <TableCell
                  className={
                    p.dureeMinutes !== null && p.dureeMinutes < nominalMinutes
                      ? "text-amber-700 dark:text-amber-400"
                      : undefined
                  }
                >
                  {formatDuree(p.dureeMinutes)}
                </TableCell>
                <TableCell>
                  <FlagList flags={p.flags} />
                </TableCell>
                <TableCell>
                  <RapportCell texte={p.rapportTexte} pdfUrl={p.rapportPdfUrl} pdfNom={p.rapportPdfNom} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
