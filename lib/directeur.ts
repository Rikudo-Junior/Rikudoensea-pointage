import { prisma } from "./db";
import { hashPassword, verifyPassword } from "./password";

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
