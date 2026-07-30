import { describe, expect, it } from "vitest";
import {
  checkArrivalFlags,
  checkDepartureFlags,
  classifyScan,
  durationMinutes,
  geolocationFlags,
  timeToMinutes,
} from "../lib/timeRules";

describe("classifyScan", () => {
  it("returns arrivee when no record exists today", () => {
    expect(classifyScan(null)).toEqual({ type: "arrivee" });
  });

  it("returns arrivee when today's record has no arrival yet", () => {
    expect(classifyScan({ heureArrivee: null, heureDepart: null })).toEqual({
      type: "arrivee",
    });
  });

  it("returns depart when arrival exists but no departure", () => {
    const result = classifyScan({ heureArrivee: "08:05:00", heureDepart: null });
    expect(result).toEqual({ type: "depart", arrivalMinutes: timeToMinutes("08:05:00") });
  });

  it("rejects a third scan when both arrival and departure exist", () => {
    const result = classifyScan({ heureArrivee: "08:05:00", heureDepart: "17:35:00" });
    expect(result.type).toBe("rejet");
  });
});

describe("checkArrivalFlags", () => {
  it("flags no lateness before or at 08:00", () => {
    expect(checkArrivalFlags(timeToMinutes("07:55"))).toEqual([]);
    expect(checkArrivalFlags(timeToMinutes("08:00"))).toEqual([]);
  });

  it("flags retard after 08:00", () => {
    expect(checkArrivalFlags(timeToMinutes("08:15"))).toEqual(["retard"]);
  });

  it("flags hors_plage outside the morning window", () => {
    expect(checkArrivalFlags(timeToMinutes("13:00"))).toContain("hors_plage");
  });
});

describe("checkDepartureFlags", () => {
  it("flags nothing for a normal full day", () => {
    const arrival = timeToMinutes("08:00");
    const departure = timeToMinutes("17:30");
    expect(checkDepartureFlags(departure, arrival)).toEqual([]);
  });

  it("flags depart_anticipe before 17:30", () => {
    const arrival = timeToMinutes("08:00");
    const departure = timeToMinutes("16:00");
    expect(checkDepartureFlags(departure, arrival)).toContain("depart_anticipe");
  });

  it("flags duree_suspecte for a very short stay", () => {
    const arrival = timeToMinutes("08:00");
    const departure = timeToMinutes("08:10");
    const flags = checkDepartureFlags(departure, arrival);
    expect(flags).toContain("duree_suspecte");
  });

  it("flags hors_plage outside the evening window", () => {
    const arrival = timeToMinutes("08:00");
    const departure = timeToMinutes("11:00");
    expect(checkDepartureFlags(departure, arrival)).toContain("hors_plage");
  });
});

describe("geolocationFlags", () => {
  it("flags sans_geoloc when denied", () => {
    expect(geolocationFlags({ status: "denied_or_unavailable" })).toEqual(["sans_geoloc"]);
  });

  it("flags hors_zone when outside radius", () => {
    expect(geolocationFlags({ status: "ok", withinRadius: false })).toEqual(["hors_zone"]);
  });

  it("flags nothing when ok and within radius", () => {
    expect(geolocationFlags({ status: "ok", withinRadius: true })).toEqual([]);
  });
});

describe("durationMinutes", () => {
  it("computes duration in minutes", () => {
    expect(durationMinutes(timeToMinutes("08:00"), timeToMinutes("17:30"))).toBe(9 * 60 + 30);
  });
});
