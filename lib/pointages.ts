import { prisma } from "./db";
import type { Flag } from "./timeRules";
import type { Classe } from "./classes";

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
  rapportTexte: string | null;
  rapportPdfUrl: string | null;
  rapportPdfNom: string | null;
  rapportSoumisAt: string | null; // ISO 8601
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
  rapportTexte: string | null;
  rapportPdfUrl: string | null;
  rapportPdfNom: string | null;
  rapportSoumisAt: Date | null;
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
    rapportTexte: p.rapportTexte,
    rapportPdfUrl: p.rapportPdfUrl,
    rapportPdfNom: p.rapportPdfNom,
    rapportSoumisAt: p.rapportSoumisAt ? p.rapportSoumisAt.toISOString() : null,
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
      rapportTexte: record.rapportTexte,
      rapportPdfUrl: record.rapportPdfUrl,
      rapportPdfNom: record.rapportPdfNom,
      rapportSoumisAt: record.rapportSoumisAt ? new Date(record.rapportSoumisAt) : null,
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
      rapportTexte: record.rapportTexte,
      rapportPdfUrl: record.rapportPdfUrl,
      rapportPdfNom: record.rapportPdfNom,
      rapportSoumisAt: record.rapportSoumisAt ? new Date(record.rapportSoumisAt) : null,
    },
  });
}

export interface PointageRecordWithClasse extends PointageRecord {
  classe: Classe;
}

export async function getAllPointagesWithUsers(): Promise<PointageRecordWithClasse[]> {
  const rows = await prisma.pointage.findMany({
    include: { user: { select: { email: true, prenom: true, nom: true, classe: true } } },
    orderBy: { date: "desc" },
  });
  return rows.map((row) => ({ ...toRecord(row), classe: row.user.classe as Classe }));
}

export async function getPointagesForUser(userId: string): Promise<PointageRecord[]> {
  const rows = await prisma.pointage.findMany({
    where: { userId },
    include: { user: { select: { email: true, prenom: true, nom: true } } },
    orderBy: { date: "asc" },
  });
  return rows.map(toRecord);
}
