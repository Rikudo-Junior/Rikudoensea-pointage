import { google, sheets_v4 } from "googleapis";
import { GOOGLE_SHEET_ID } from "./config";
import type { PointageRecord } from "./pointages";
import type { Flag } from "./timeRules";

const UTILISATEURS_SHEET = "Utilisateurs";
const POINTAGES_SHEET = "Pointages";

const UTILISATEURS_HEADERS = ["Email", "Prenom", "Nom", "DateInscription", "Statut"] as const;
const POINTAGES_HEADERS = [
  "Email",
  "Prenom",
  "Nom",
  "Date",
  "HeureArrivee",
  "LatArrivee",
  "LonArrivee",
  "HeureDepart",
  "LatDepart",
  "LonDepart",
  "IPArrivee",
  "IPDepart",
  "Flags",
  "DureeMinutes",
] as const;

export interface UserRecord {
  email: string;
  prenom: string;
  nom: string;
  dateInscription: string;
  statut: "actif" | "desactive";
}

export type { PointageRecord };

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL_MS = 15_000;

function getCached<T>(key: string): T | undefined {
  const entry = cache.get(key);
  if (!entry || entry.expiresAt < Date.now()) return undefined;
  return entry.value as T;
}

function setCached<T>(key: string, value: T): void {
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

export function invalidateCache(): void {
  cache.clear();
}

let sheetsClientPromise: Promise<sheets_v4.Sheets> | null = null;

function getSheetsClient(): Promise<sheets_v4.Sheets> {
  if (!sheetsClientPromise) {
    sheetsClientPromise = (async () => {
      const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
      const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
      if (!email || !privateKey) {
        throw new Error("Identifiants Google Service Account manquants (GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY).");
      }
      const auth = new google.auth.JWT({
        email,
        key: privateKey,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      });
      return google.sheets({ version: "v4", auth });
    })();
  }
  return sheetsClientPromise;
}

function requireSheetId(): string {
  if (!GOOGLE_SHEET_ID) {
    throw new Error("GOOGLE_SHEET_ID (ou GOOGLE_SHEET_ID_TEST en TEST_MODE) n'est pas configuré.");
  }
  return GOOGLE_SHEET_ID;
}

async function readSheet(sheetName: string): Promise<string[][]> {
  const cacheKey = `read:${sheetName}`;
  const cached = getCached<string[][]>(cacheKey);
  if (cached) return cached;

  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: requireSheetId(),
    range: `${sheetName}!A:Z`,
  });
  const rows = res.data.values ?? [];
  setCached(cacheKey, rows);
  return rows;
}

function rowsToRecords(rows: string[][]): Record<string, string>[] {
  if (rows.length === 0) return [];
  const [header, ...body] = rows;
  return body.map((row) => {
    const record: Record<string, string> = {};
    header.forEach((col, i) => {
      record[col] = row[i] ?? "";
    });
    return record;
  });
}

// ---------- Utilisateurs ----------

export async function getUserByEmail(email: string): Promise<UserRecord | null> {
  const rows = await readSheet(UTILISATEURS_SHEET);
  const records = rowsToRecords(rows);
  const found = records.find((r) => r.Email?.toLowerCase() === email.toLowerCase());
  if (!found) return null;
  return {
    email: found.Email,
    prenom: found.Prenom,
    nom: found.Nom,
    dateInscription: found.DateInscription,
    statut: (found.Statut as UserRecord["statut"]) || "actif",
  };
}

export async function createUser(user: UserRecord): Promise<void> {
  const sheets = await getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: requireSheetId(),
    range: `${UTILISATEURS_SHEET}!A:E`,
    valueInputOption: "RAW",
    requestBody: {
      values: [
        [user.email, user.prenom, user.nom, user.dateInscription, user.statut],
      ],
    },
  });
  invalidateCache();
}

// ---------- Pointages ----------

function recordToRow(record: PointageRecord): string[] {
  return [
    record.email,
    record.prenom,
    record.nom,
    record.date,
    record.heureArrivee ?? "",
    record.latArrivee?.toString() ?? "",
    record.lonArrivee?.toString() ?? "",
    record.heureDepart ?? "",
    record.latDepart?.toString() ?? "",
    record.lonDepart?.toString() ?? "",
    record.ipArrivee ?? "",
    record.ipDepart ?? "",
    record.flags.join(","),
    record.dureeMinutes?.toString() ?? "",
  ];
}

function rowToRecord(row: string[]): PointageRecord {
  const get = (i: number) => row[i] ?? "";
  return {
    email: get(0),
    prenom: get(1),
    nom: get(2),
    date: get(3),
    heureArrivee: get(4) || null,
    latArrivee: get(5) ? Number(get(5)) : null,
    lonArrivee: get(6) ? Number(get(6)) : null,
    heureDepart: get(7) || null,
    latDepart: get(8) ? Number(get(8)) : null,
    lonDepart: get(9) ? Number(get(9)) : null,
    ipArrivee: get(10) || null,
    ipDepart: get(11) || null,
    flags: get(12) ? (get(12).split(",") as Flag[]) : [],
    dureeMinutes: get(13) ? Number(get(13)) : null,
    rapportTexte: null,
    rapportPdfUrl: null,
    rapportPdfNom: null,
    rapportSoumisAt: null,
  };
}

/** Retourne le pointage du jour pour cet email, ainsi que le numéro de ligne (1-based, incluant l'en-tête) pour permettre une mise à jour ciblée. */
export async function getTodayPointage(
  email: string,
  date: string,
): Promise<{ record: PointageRecord; rowNumber: number } | null> {
  const rows = await readSheet(POINTAGES_SHEET);
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row[0]?.toLowerCase() === email.toLowerCase() && row[3] === date) {
      return { record: rowToRecord(row), rowNumber: i + 1 };
    }
  }
  return null;
}

export async function getAllPointages(): Promise<PointageRecord[]> {
  const rows = await readSheet(POINTAGES_SHEET);
  return rows.slice(1).map(rowToRecord);
}

export async function appendPointage(record: PointageRecord): Promise<void> {
  const sheets = await getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: requireSheetId(),
    range: `${POINTAGES_SHEET}!A:N`,
    valueInputOption: "RAW",
    requestBody: { values: [recordToRow(record)] },
  });
  invalidateCache();
}

export async function updatePointageRow(rowNumber: number, record: PointageRecord): Promise<void> {
  const sheets = await getSheetsClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId: requireSheetId(),
    range: `${POINTAGES_SHEET}!A${rowNumber}:N${rowNumber}`,
    valueInputOption: "RAW",
    requestBody: { values: [recordToRow(record)] },
  });
  invalidateCache();
}

export const SHEET_HEADERS = {
  utilisateurs: UTILISATEURS_HEADERS,
  pointages: POINTAGES_HEADERS,
};
