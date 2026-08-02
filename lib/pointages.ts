import { prisma } from "./db";
import type { Flag } from "./timeRules";

export interface PointageRecord {
  email: string;
  prenom: string;
  nom: string;
  date: string; // YYYY-MM-DD
  heureArrivee: string | null; // HH:MM:SS
  latArrivee: number | null;
  lonArrivee: number | null;
  heureDepart: string | null;
  latDepart: number | null;
  lonDepart: number | null;
  ipArrivee: string | null;
  ipDepart: string | null;
  flags: Flag[];
  dureeMinutes: number | null;
}

interface PointageWithUser {
  date: string;
  heureArrivee: string | null;
  latArrivee: number | null;
  lonArrivee: number | null;
  heureDepart: string | null;
  latDepart: number | null;
  lonDepart: number | null;
  ipArrivee: string | null;
  ipDepart: string | null;
  flags: string[];
  dureeMinutes: number | null;
  user: { email: string; prenom: string; nom: string };
}

function toRecord(p: PointageWithUser): PointageRecord {
  return {
    email: p.user.email,
    prenom: p.user.prenom,
    nom: p.user.nom,
    date: p.date,
    heureArrivee: p.heureArrivee,
    latArrivee: p.latArrivee,
    lonArrivee: p.lonArrivee,
    heureDepart: p.heureDepart,
    latDepart: p.latDepart,
    lonDepart: p.lonDepart,
    ipArrivee: p.ipArrivee,
    ipDepart: p.ipDepart,
    flags: p.flags as Flag[],
    dureeMinutes: p.dureeMinutes,
  };
}

export async function getTodayPointage(
  userId: string,
  date: string,
): Promise<{ id: string; record: PointageRecord } | null> {
  const found = await prisma.pointage.findUnique({
    where: { userId_date: { userId, date } },
    include: { user: { select: { email: true, prenom: true, nom: true } } },
  });
  return found ? { id: found.id, record: toRecord(found) } : null;
}

export async function appendPointage(userId: string, record: PointageRecord): Promise<void> {
  await prisma.pointage.create({
    data: {
      userId,
      date: record.date,
      heureArrivee: record.heureArrivee,
      latArrivee: record.latArrivee,
      lonArrivee: record.lonArrivee,
      heureDepart: record.heureDepart,
      latDepart: record.latDepart,
      lonDepart: record.lonDepart,
      ipArrivee: record.ipArrivee,
      ipDepart: record.ipDepart,
      flags: record.flags,
      dureeMinutes: record.dureeMinutes,
    },
  });
}

export async function updatePointage(id: string, record: PointageRecord): Promise<void> {
  await prisma.pointage.update({
    where: { id },
    data: {
      heureArrivee: record.heureArrivee,
      latArrivee: record.latArrivee,
      lonArrivee: record.lonArrivee,
      heureDepart: record.heureDepart,
      latDepart: record.latDepart,
      lonDepart: record.lonDepart,
      ipArrivee: record.ipArrivee,
      ipDepart: record.ipDepart,
      flags: record.flags,
      dureeMinutes: record.dureeMinutes,
    },
  });
}

export async function getAllPointagesWithUsers(): Promise<PointageRecord[]> {
  const rows = await prisma.pointage.findMany({
    include: { user: { select: { email: true, prenom: true, nom: true } } },
    orderBy: { date: "desc" },
  });
  return rows.map(toRecord);
}

export async function getPointagesForUser(userId: string): Promise<PointageRecord[]> {
  const rows = await prisma.pointage.findMany({
    where: { userId },
    include: { user: { select: { email: true, prenom: true, nom: true } } },
    orderBy: { date: "asc" },
  });
  return rows.map(toRecord);
}
