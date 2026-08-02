import { describe, expect, it } from "vitest";
import { computeInternStats, workingDays } from "../lib/internStats";
import type { PointageRecord } from "../lib/pointages";
import type { Flag } from "../lib/timeRules";

function makeRecord(overrides: Partial<PointageRecord> & { date: string }): PointageRecord {
  return {
    email: "stagiaire@ensea.edu.ci",
    prenom: "Stagiaire",
    nom: "Test",
    heureArrivee: null,
    latArrivee: null,
    lonArrivee: null,
    heureDepart: null,
    latDepart: null,
    lonDepart: null,
    ipArrivee: null,
    ipDepart: null,
    flags: [] as Flag[],
    dureeMinutes: null,
    ...overrides,
  };
}

describe("workingDays", () => {
  it("excludes weekends within a single week", () => {
    expect(workingDays("2026-08-03", "2026-08-07")).toEqual([
      "2026-08-03",
      "2026-08-04",
      "2026-08-05",
      "2026-08-06",
      "2026-08-07",
    ]);
  });

  it("skips the weekend spanning two weeks", () => {
    expect(workingDays("2026-08-03", "2026-08-10")).toEqual([
      "2026-08-03",
      "2026-08-04",
      "2026-08-05",
      "2026-08-06",
      "2026-08-07",
      "2026-08-10",
    ]);
  });

  it("returns an empty array when end is before start", () => {
    expect(workingDays("2026-08-10", "2026-08-03")).toEqual([]);
  });
});

describe("computeInternStats", () => {
  it("counts worked hours and absences up to today (bounded, not future)", () => {
    const pointages: PointageRecord[] = [
      makeRecord({ date: "2026-08-03", heureArrivee: "08:00:00", heureDepart: "17:30:00", dureeMinutes: 570 }),
    ];

    const stats = computeInternStats(pointages, "2026-08-04");

    expect(stats.joursOuvresEcoules).toBe(2); // 2026-08-03 (lun) + 2026-08-04 (mar)
    expect(stats.joursTravailles).toBe(1);
    expect(stats.joursAbsence).toBe(1); // 2026-08-04 sans pointage
    expect(stats.heuresEffectuees).toBe(9.5);
    expect(stats.heuresAttendues).toBe(19); // 2 jours ouvrés * 9.5h
  });

  it("counts cumulative retard/depart_anticipe flags across all pointages", () => {
    const pointages: PointageRecord[] = [
      makeRecord({ date: "2026-08-03", heureArrivee: "08:15:00", flags: ["retard"] }),
      makeRecord({
        date: "2026-08-04",
        heureArrivee: "08:00:00",
        heureDepart: "16:00:00",
        dureeMinutes: 480,
        flags: ["depart_anticipe", "retard"],
      }),
    ];

    const stats = computeInternStats(pointages, "2026-08-04");

    expect(stats.retards).toBe(2);
    expect(stats.departsAnticipes).toBe(1);
  });

  it("returns zeroed stats when today is before the stage start", () => {
    const stats = computeInternStats([], "2026-07-30");
    expect(stats.joursOuvresEcoules).toBe(0);
    expect(stats.joursTravailles).toBe(0);
    expect(stats.joursAbsence).toBe(0);
    expect(stats.heuresAttendues).toBe(0);
  });

  it("caps elapsed working days at the stage end date", () => {
    const stats = computeInternStats([], "2099-01-01");
    expect(stats.joursOuvresEcoules).toBe(workingDays("2026-08-03", "2026-08-28").length);
  });
});
