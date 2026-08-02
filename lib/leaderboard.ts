import type { InternOverviewRow } from "@/components/InternsOverviewTable";

export interface DashboardLeaderboard {
  ponctualite: InternOverviewRow | null; // le moins de retards
  retards: InternOverviewRow | null; // le plus de retards
  assiduite: InternOverviewRow | null; // le moins d'absences
  heures: InternOverviewRow | null; // le plus d'heures effectuées
}

/** Ignore les stagiaires pour qui la période de stage n'a pas encore commencé (aucune donnée exploitable). */
function best(
  interns: InternOverviewRow[],
  compare: (a: InternOverviewRow, b: InternOverviewRow) => number,
): InternOverviewRow | null {
  const eligible = interns.filter((i) => i.stats.joursOuvresEcoules > 0);
  if (eligible.length === 0) return null;
  return [...eligible].sort(compare)[0];
}

export function computeLeaderboard(interns: InternOverviewRow[]): DashboardLeaderboard {
  return {
    ponctualite: best(
      interns,
      (a, b) => a.stats.retards - b.stats.retards || b.stats.joursTravailles - a.stats.joursTravailles,
    ),
    retards: best(interns, (a, b) => b.stats.retards - a.stats.retards),
    assiduite: best(
      interns,
      (a, b) => a.stats.joursAbsence - b.stats.joursAbsence || b.stats.joursTravailles - a.stats.joursTravailles,
    ),
    heures: best(interns, (a, b) => b.stats.heuresEffectuees - a.stats.heuresEffectuees),
  };
}
