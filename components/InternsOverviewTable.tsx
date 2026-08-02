"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { InternStats } from "@/lib/internStats";
import { CLASSES, type Classe } from "@/lib/classes";

export interface InternOverviewRow {
  email: string;
  prenom: string;
  nom: string;
  classe: Classe;
  statut: "actif" | "desactive";
  dateInscription: string; // YYYY-MM-DD
  stats: InternStats;
}

function formatHeures(heures: number): string {
  const h = Math.floor(heures);
  const m = Math.round((heures - h) * 60);
  return `${h}h${String(m).padStart(2, "0")}`;
}

export function InternsOverviewTable({ interns }: { interns: InternOverviewRow[] }) {
  const [search, setSearch] = useState("");
  const [classeFilter, setClasseFilter] = useState<Classe | "toutes">("toutes");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const sorted = [...interns].sort((a, b) => `${a.nom}${a.prenom}`.localeCompare(`${b.nom}${b.prenom}`));
    return sorted.filter((i) => {
      if (classeFilter !== "toutes" && i.classe !== classeFilter) return false;
      if (!q) return true;
      return i.prenom.toLowerCase().includes(q) || i.nom.toLowerCase().includes(q) || i.email.toLowerCase().includes(q);
    });
  }, [interns, search, classeFilter]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Rechercher un stagiaire (nom, email)…"
          className="w-64"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex gap-1 rounded-md border border-border p-1">
          {(["toutes", ...CLASSES] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setClasseFilter(c)}
              className={`cursor-pointer rounded px-3 py-1 text-sm transition-colors ${
                classeFilter === c
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {c === "toutes" ? "Toutes" : c}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Stagiaire</TableHead>
              <TableHead>Classe</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Inscrit le</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Jours travaillés</TableHead>
              <TableHead>Absences</TableHead>
              <TableHead>Heures eff. / attendues</TableHead>
              <TableHead>Retards</TableHead>
              <TableHead>Départs anticipés</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="py-8 text-center text-muted-foreground">
                  Aucun stagiaire inscrit.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((i) => (
              <TableRow key={i.email}>
                <TableCell className="whitespace-nowrap font-medium">
                  {i.prenom} {i.nom}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{i.classe}</Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap">{i.email}</TableCell>
                <TableCell className="whitespace-nowrap">{i.dateInscription}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={i.statut === "desactive" ? "text-muted-foreground" : undefined}>
                    {i.statut === "actif" ? "Actif" : "Désactivé"}
                  </Badge>
                </TableCell>
                <TableCell>{i.stats.joursTravailles}</TableCell>
                <TableCell className={i.stats.joursAbsence > 0 ? "text-destructive font-medium" : undefined}>
                  {i.stats.joursAbsence}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatHeures(i.stats.heuresEffectuees)} / {formatHeures(i.stats.heuresAttendues)}
                </TableCell>
                <TableCell>{i.stats.retards}</TableCell>
                <TableCell>{i.stats.departsAnticipes}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
