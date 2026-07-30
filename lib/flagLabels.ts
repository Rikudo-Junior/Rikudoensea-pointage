import type { Flag } from "./timeRules";

export const FLAG_LABELS: Record<Flag, { label: string; tone: "warning" | "danger" }> = {
  sans_geoloc: { label: "Sans géolocalisation", tone: "warning" },
  hors_zone: { label: "Hors zone", tone: "warning" },
  retard: { label: "Retard", tone: "warning" },
  depart_anticipe: { label: "Départ anticipé", tone: "warning" },
  duree_suspecte: { label: "Durée suspecte", tone: "danger" },
  hors_plage: { label: "Hors plage horaire", tone: "warning" },
};
