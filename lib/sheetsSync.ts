import {
  appendPointage,
  createUser,
  getTodayPointage,
  getUserByEmail,
  updatePointageRow,
  type PointageRecord,
  type UserRecord,
} from "./sheets";

// Google Sheets n'est plus la source de vérité (voir lib/pointages.ts / lib/users.ts,
// adossés à Postgres) : ce module ne fait qu'y répliquer les écritures, en best-effort.
// Un échec de synchronisation ne doit jamais faire échouer la requête de l'utilisateur.

export async function syncUserToSheets(user: UserRecord): Promise<void> {
  try {
    const existing = await getUserByEmail(user.email);
    if (!existing) {
      await createUser(user);
    }
  } catch (err) {
    console.error("[sheetsSync] échec synchronisation utilisateur", err);
  }
}

export async function syncPointageToSheets(record: PointageRecord): Promise<void> {
  try {
    const existing = await getTodayPointage(record.email, record.date);
    if (existing) {
      await updatePointageRow(existing.rowNumber, record);
    } else {
      await appendPointage(record);
    }
  } catch (err) {
    console.error("[sheetsSync] échec synchronisation pointage", err);
  }
}
