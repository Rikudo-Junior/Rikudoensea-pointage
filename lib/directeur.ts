import { prisma } from "./db";
import { hashPassword, verifyPassword } from "./password";
import { STAGE_END_DATE, STAGE_START_DATE } from "./config";
import type { StageDates } from "./internStats";

// Compte partagé du Directeur des études — toujours une seule ligne (id fixe).
const DIRECTEUR_ID = "directeur";

/**
 * Vérifie le mot de passe du Directeur des études. Si aucun compte n'existe encore
 * en base, compare au legacy `DASHBOARD_PASSWORD` (.env) et, en cas de correspondance,
 * migre silencieusement ce mot de passe vers la BDD — pour permettre son changement
 * depuis le dashboard sans script de migration manuel.
 */
export async function verifyDirecteurPassword(password: string): Promise<boolean> {
  const account = await prisma.directeurAccount.findUnique({ where: { id: DIRECTEUR_ID } });

  if (account) {
    return verifyPassword(password, account.passwordHash);
  }

  const legacyPassword = process.env.DASHBOARD_PASSWORD;
  if (!legacyPassword || password !== legacyPassword) return false;

  const passwordHash = await hashPassword(password);
  await prisma.directeurAccount.create({ data: { id: DIRECTEUR_ID, passwordHash } });
  return true;
}

export async function changeDirecteurPassword(currentPassword: string, newPassword: string): Promise<boolean> {
  const validCurrent = await verifyDirecteurPassword(currentPassword);
  if (!validCurrent) return false;

  const passwordHash = await hashPassword(newPassword);
  await prisma.directeurAccount.upsert({
    where: { id: DIRECTEUR_ID },
    create: { id: DIRECTEUR_ID, passwordHash },
    update: { passwordHash },
  });
  return true;
}

/**
 * Dates de la période de stage en cours. Si le directeur ne les a jamais définies
 * (aucun compte, ou compte sans dates enregistrées), retombe sur les valeurs par défaut
 * de lib/config.ts.
 */
export async function getStageDates(): Promise<StageDates> {
  const account = await prisma.directeurAccount.findUnique({ where: { id: DIRECTEUR_ID } });
  return {
    debut: account?.stageDateDebut ?? STAGE_START_DATE,
    fin: account?.stageDateFin ?? STAGE_END_DATE,
  };
}

/**
 * Le compte directeur existe toujours à ce stade : cette action n'est accessible qu'avec
 * un cookie dashboard valide, lui-même émis uniquement après un login réussi via
 * verifyDirecteurPassword, qui migre paresseusement le compte s'il n'existait pas encore.
 */
export async function setStageDates(debut: string, fin: string): Promise<void> {
  await prisma.directeurAccount.update({
    where: { id: DIRECTEUR_ID },
    data: { stageDateDebut: debut, stageDateFin: fin },
  });
}
