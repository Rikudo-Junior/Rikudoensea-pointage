import { describe, expect, it } from "vitest";
import { computeLeaderboard } from "../lib/leaderboard";
import type { InternOverviewRow } from "../components/InternsOverviewTable";
import type { InternStats } from "../lib/internStats";

function makeStats(overrides: Partial<InternStats>): InternStats {
  return {
    joursOuvresEcoules: 5,
    joursTravailles: 5,
    joursAbsence: 0,
    heuresEffectuees: 0,
    heuresAttendues: 0,
    retards: 0,
    departsAnticipes: 0,
    historique: [],
    ...overrides,
  };
}

function makeIntern(overrides: Partial<InternOverviewRow> & { stats: InternStats }): InternOverviewRow {
  return {
    email: "test@ensea.edu.ci",
    prenom: "Test",
    nom: "Stagiaire",
    classe: "ISE",
    statut: "actif",
    dateInscription: "2026-08-01",
    ...overrides,
  };
}

describe("computeLeaderboard", () => {
  it("returns null everywhere when no intern has started the stage period", () => {
    const interns = [makeIntern({ stats: makeStats({ joursOuvresEcoules: 0 }) })];
    const board = computeLeaderboard(interns);
    expect(board.ponctualite).toBeNull();
    expect(board.retards).toBeNull();
    expect(board.assiduite).toBeNull();
    expect(board.heures).toBeNull();
  });

  it("picks the most punctual and the most frequently late intern", () => {
    const punctual = makeIntern({ prenom: "Aya", stats: makeStats({ retards: 0 }) });
    const late = makeIntern({ prenom: "Bakary", stats: makeStats({ retards: 4 }) });
    const board = computeLeaderboard([punctual, late]);
    expect(board.ponctualite?.prenom).toBe("Aya");
    expect(board.retards?.prenom).toBe("Bakary");
  });

  it("picks best attendance (fewest absences) and most hours worked", () => {
    const goodAttendance = makeIntern({ prenom: "Aya", stats: makeStats({ joursAbsence: 0, heuresEffectuees: 20 }) });
    const moreAbsences = makeIntern({ prenom: "Bakary", stats: makeStats({ joursAbsence: 2, heuresEffectuees: 40 }) });
    const board = computeLeaderboard([goodAttendance, moreAbsences]);
    expect(board.assiduite?.prenom).toBe("Aya");
    expect(board.heures?.prenom).toBe("Bakary");
  });
});
