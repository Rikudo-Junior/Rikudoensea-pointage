import { RADIUS_M, SCHOOL_LAT, SCHOOL_LON } from "./config";

export interface Coordinates {
  lat: number;
  lon: number;
}

/** Distance en mètres entre deux points GPS (formule de haversine). */
export function distanceMeters(a: Coordinates, b: Coordinates): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}

export function isWithinSchoolRadius(coords: Coordinates, radiusM: number = RADIUS_M): boolean {
  return distanceMeters(coords, { lat: SCHOOL_LAT, lon: SCHOOL_LON }) <= radiusM;
}
