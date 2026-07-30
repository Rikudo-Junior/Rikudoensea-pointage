import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, TEST_MODE } from "@/lib/config";
import { verifySessionToken } from "@/lib/session";
import { now } from "@/lib/clock";
import { schoolDateString, schoolMinutesOfDay, schoolTimeString } from "@/lib/schoolTime";
import {
  checkArrivalFlags,
  checkDepartureFlags,
  classifyScan,
  durationMinutes,
  geolocationFlags,
  type Flag,
  type GeolocResult,
} from "@/lib/timeRules";
import { isWithinSchoolRadius } from "@/lib/geoloc";
import { getRequestIp } from "@/lib/ip";
import { appendPointage, getTodayPointage, updatePointageRow, type PointageRecord } from "@/lib/sheets";

function uniqFlags(flags: Flag[]): Flag[] {
  return Array.from(new Set(flags));
}

export async function POST(req: NextRequest) {
  const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = sessionCookie ? await verifySessionToken(sessionCookie) : null;
  if (!session) {
    return NextResponse.json({ error: "Session expirée. Merci de vous reconnecter." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const geolocStatus: GeolocResult["status"] =
    body?.geolocStatus === "ok" ? "ok" : "denied_or_unavailable";
  const lat = typeof body?.lat === "number" ? body.lat : null;
  const lon = typeof body?.lon === "number" ? body.lon : null;
  const testNowIso = TEST_MODE && typeof body?.testNowIso === "string" ? body.testNowIso : null;

  const nowDate = now(testNowIso);
  const date = schoolDateString(nowDate);
  const nowMinutes = schoolMinutesOfDay(nowDate);
  const nowTime = schoolTimeString(nowDate);
  const ip = getRequestIp(req);

  const withinRadius = geolocStatus === "ok" && lat !== null && lon !== null
    ? isWithinSchoolRadius({ lat, lon })
    : undefined;
  const geoFlags = geolocationFlags({ status: geolocStatus, withinRadius });

  const today = await getTodayPointage(session.email, date);
  const classification = classifyScan(today?.record ?? null);

  if (classification.type === "rejet") {
    return NextResponse.json({ error: classification.reason }, { status: 409 });
  }

  if (classification.type === "arrivee") {
    const arrivalFlags = checkArrivalFlags(nowMinutes);
    const flags = uniqFlags([...arrivalFlags, ...geoFlags]);
    const record: PointageRecord = {
      email: session.email,
      prenom: session.prenom,
      nom: session.nom,
      date,
      heureArrivee: nowTime,
      latArrivee: lat,
      lonArrivee: lon,
      heureDepart: null,
      latDepart: null,
      lonDepart: null,
      ipArrivee: ip,
      ipDepart: null,
      flags,
      dureeMinutes: null,
    };
    await appendPointage(record);
    return NextResponse.json({ ok: true, type: "arrivee", flags, heure: nowTime });
  }

  // classification.type === "depart"
  const departureFlags = checkDepartureFlags(nowMinutes, classification.arrivalMinutes);
  const existingFlags = today?.record.flags ?? [];
  const flags = uniqFlags([...existingFlags, ...departureFlags, ...geoFlags]);
  const dureeMinutes = durationMinutes(classification.arrivalMinutes, nowMinutes);

  const updatedRecord: PointageRecord = {
    ...(today!.record),
    heureDepart: nowTime,
    latDepart: lat,
    lonDepart: lon,
    ipDepart: ip,
    flags,
    dureeMinutes,
  };
  await updatePointageRow(today!.rowNumber, updatedRecord);
  return NextResponse.json({ ok: true, type: "depart", flags, heure: nowTime, dureeMinutes });
}
