import {
  EVENING_WINDOW,
  MIN_DURATION_HOURS,
  MORNING_WINDOW,
  NOMINAL_END,
  NOMINAL_START,
} from "./config";

export type Flag =
  | "sans_geoloc"
  | "hors_zone"
  | "retard"
  | "depart_anticipe"
  | "duree_suspecte"
  | "hors_plage";

export interface TimeWindow {
  start: string; // "HH:MM"
  end: string; // "HH:MM"
}

export interface PointageDayRecord {
  heureArrivee?: string | null; // "HH:MM:SS", heure locale (Africa/Abidjan) du jour
  heureDepart?: string | null;
}

export type ScanClassification =
  | { type: "arrivee" }
  | { type: "depart"; arrivalMinutes: number }
  | { type: "rejet"; reason: string };

export interface GeolocResult {
  status: "ok" | "denied_or_unavailable";
  withinRadius?: boolean;
}

/** Convertit "HH:MM" ou "HH:MM:SS" en minutes depuis minuit. Toutes les entrées sont supposées être en heure de l'école (voir lib/schoolTime.ts). */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function isWithinWindow(minutes: number, window: TimeWindow): boolean {
  return minutes >= timeToMinutes(window.start) && minutes <= timeToMinutes(window.end);
}

/**
 * Détermine automatiquement si le scan du jour correspond à une arrivée, un départ,
 * ou doit être rejeté (les deux pointages du jour existent déjà). C'est cette logique,
 * combinée aux fenêtres horaires ci-dessous, qui limite naturellement à 2 pointages
 * valides par jour sans compteur manuel.
 */
export function classifyScan(today: PointageDayRecord | null): ScanClassification {
  if (!today || !today.heureArrivee) {
    return { type: "arrivee" };
  }
  if (!today.heureDepart) {
    return { type: "depart", arrivalMinutes: timeToMinutes(today.heureArrivee) };
  }
  return {
    type: "rejet",
    reason:
      "Vous avez déjà pointé votre arrivée et votre départ aujourd'hui. Contactez le directeur des études en cas d'erreur.",
  };
}

export function checkArrivalFlags(arrivalMinutes: number): Flag[] {
  const flags: Flag[] = [];
  if (!isWithinWindow(arrivalMinutes, MORNING_WINDOW)) flags.push("hors_plage");
  if (arrivalMinutes > timeToMinutes(NOMINAL_START)) flags.push("retard");
  return flags;
}

export function checkDepartureFlags(departureMinutes: number, arrivalMinutes: number): Flag[] {
  const flags: Flag[] = [];
  if (!isWithinWindow(departureMinutes, EVENING_WINDOW)) flags.push("hors_plage");
  if (departureMinutes < timeToMinutes(NOMINAL_END)) flags.push("depart_anticipe");
  const durationHours = (departureMinutes - arrivalMinutes) / 60;
  if (durationHours < MIN_DURATION_HOURS) flags.push("duree_suspecte");
  return flags;
}

/** Le refus/l'échec de géolocalisation n'est jamais bloquant, seulement marqué pour revue. */
export function geolocationFlags(geoloc: GeolocResult): Flag[] {
  if (geoloc.status === "denied_or_unavailable") return ["sans_geoloc"];
  if (geoloc.status === "ok" && geoloc.withinRadius === false) return ["hors_zone"];
  return [];
}

export function durationMinutes(arrivalMinutes: number, departureMinutes: number): number {
  return departureMinutes - arrivalMinutes;
}
