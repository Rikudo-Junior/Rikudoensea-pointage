import { describe, expect, it } from "vitest";
import { distanceMeters, isWithinSchoolRadius } from "../lib/geoloc";
import { SCHOOL_LAT, SCHOOL_LON } from "../lib/config";

describe("distanceMeters", () => {
  it("returns ~0 for identical coordinates", () => {
    expect(distanceMeters({ lat: SCHOOL_LAT, lon: SCHOOL_LON }, { lat: SCHOOL_LAT, lon: SCHOOL_LON })).toBeCloseTo(
      0,
      3,
    );
  });

  it("returns a larger distance for far-apart coordinates", () => {
    // Paris vs Marseille, roughly 660km apart
    const paris = { lat: 48.8566, lon: 2.3522 };
    const marseille = { lat: 43.2965, lon: 5.3698 };
    const d = distanceMeters(paris, marseille);
    expect(d).toBeGreaterThan(600_000);
    expect(d).toBeLessThan(700_000);
  });
});

describe("isWithinSchoolRadius", () => {
  it("is true exactly at the school coordinates", () => {
    expect(isWithinSchoolRadius({ lat: SCHOOL_LAT, lon: SCHOOL_LON })).toBe(true);
  });

  it("is false far outside the radius", () => {
    expect(isWithinSchoolRadius({ lat: SCHOOL_LAT + 1, lon: SCHOOL_LON + 1 })).toBe(false);
  });

  it("respects a custom radius override", () => {
    const nearby = { lat: SCHOOL_LAT + 0.01, lon: SCHOOL_LON }; // ~1.1km away
    expect(isWithinSchoolRadius(nearby, 100)).toBe(false);
    expect(isWithinSchoolRadius(nearby, 2000)).toBe(true);
  });
});
