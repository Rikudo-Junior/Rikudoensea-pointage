import { NOMINAL_END, NOMINAL_START } from "./config";
import type { PointageRecord } from "./pointages";
import { timeToMinutes } from "./timeRules";

export interface StageDates {
  debut: string; // YYYY-MM-DD
  fin: string; // YYYY-MM-DD
}

function parseDate(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00Z`);
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function isWeekday(date: Date): boolean {
  const day = date.getUTCDay();
  return day !== 0 && day !== 6;
}

/** Jours ouvrés (lun-ven) entre `start` et `end` inclus, au format YYYY-MM-DD. */
export function workingDays(start: string, end: string): string[] {
  const days: string[] = [];
  const endDate = parseDate(end);
  const cursor = parseDate(start);
  while (cursor <= endDate) {
    if (isWeekday(cursor)) days.push(formatDate(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

export interface InternStats {
  joursOuvresEcoules: number;
  joursTravailles: number;
  joursAbsence: number;
  heuresEffectuees: number;
  heuresAttendues: number;
  retards: number;
  departsAnticipes: number;
  historique: PointageRecord[];
}

/**
 * `today` (YYYY-MM-DD, heure école) est borné à `stageDates.fin` : les jours futurs du
 * stage ne comptent ni en heures attendues ni en absence.
 */
export function computeInternStats(pointages: PointageRecord[], today: string, stageDates: StageDates): InternStats {
  const boundedToday = today < stageDates.fin ? today : stageDates.fin;
  const elapsedDays = today < stageDates.debut ? [] : workingDays(stageDates.debut, boundedToday);

  const byDate = new Map(pointages.map((p) => [p.date, p]));
  const nominalMinutesPerDay = timeToMinutes(NOMINAL_END) - timeToMinutes(NOMINAL_START);

  let joursTravailles = 0;
  let joursAbsence = 0;
  let minutesEffectuees = 0;

  for (const day of elapsedDays) {
    const record = byDate.get(day);
    if (record?.heureArrivee) {
      joursTravailles += 1;
      minutesEffectuees += record.dureeMinutes ?? 0;
    } else {
      joursAbsence += 1;
    }
  }

  const retards = pointages.filter((p) => p.flags.includes("retard")).length;
  const departsAnticipes = pointages.filter((p) => p.flags.includes("depart_anticipe")).length;

  return {
    joursOuvresEcoules: elapsedDays.length,
    joursTravailles,
    joursAbsence,
    heuresEffectuees: minutesEffectuees / 60,
    heuresAttendues: (elapsedDays.length * nominalMinutesPerDay) / 60,
    retards,
    departsAnticipes,
    historique: [...pointages].sort((a, b) => (a.date < b.date ? 1 : -1)),
  };
}
