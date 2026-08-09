import { prisma } from "./db";

// Verrouillage temporaire après tentatives de connexion échouées, contre le brute-force
// sur /api/login et /api/dashboard-login. Stocké en base (table LoginAttempt, gérée en
// SQL brut — voir prisma/schema.prisma) plutôt qu'en mémoire : les fonctions serverless
// ne partagent pas d'état entre invocations.
const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

interface AttemptRow {
  count: number;
  lockedUntil: Date | null;
}

export async function checkLockout(key: string): Promise<{ locked: boolean; retryAfterSeconds: number }> {
  const rows = await prisma.$queryRaw<AttemptRow[]>`
    SELECT count, "lockedUntil" FROM "LoginAttempt" WHERE key = ${key}
  `;
  const lockedUntil = rows[0]?.lockedUntil;
  if (lockedUntil && lockedUntil.getTime() > Date.now()) {
    return { locked: true, retryAfterSeconds: Math.ceil((lockedUntil.getTime() - Date.now()) / 1000) };
  }
  return { locked: false, retryAfterSeconds: 0 };
}

export async function recordFailedAttempt(key: string): Promise<void> {
  const rows = await prisma.$queryRaw<AttemptRow[]>`
    SELECT count, "lockedUntil" FROM "LoginAttempt" WHERE key = ${key}
  `;
  const row = rows[0];
  const expired = row?.lockedUntil && row.lockedUntil.getTime() <= Date.now();
  const nextCount = !row || expired ? 1 : row.count + 1;
  const lockedUntil = nextCount >= MAX_ATTEMPTS ? new Date(Date.now() + LOCKOUT_MINUTES * 60_000) : null;

  await prisma.$executeRaw`
    INSERT INTO "LoginAttempt" (key, count, "lockedUntil")
    VALUES (${key}, ${nextCount}, ${lockedUntil})
    ON CONFLICT (key) DO UPDATE SET count = ${nextCount}, "lockedUntil" = ${lockedUntil}
  `;
}

export async function clearAttempts(key: string): Promise<void> {
  await prisma.$executeRaw`DELETE FROM "LoginAttempt" WHERE key = ${key}`;
}
