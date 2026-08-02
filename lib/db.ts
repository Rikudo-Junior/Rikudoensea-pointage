import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "./generated/prisma/client";

// Prisma 7 exige un driver adapter explicite (plus de `url` dans le datasource du schéma).
// Neon est serverless : le pool sous-jacent fonctionne aussi bien en environnement
// serverless (Vercel) qu'en local.
function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL manquant.");
  }
  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Construction paresseuse : `next build` importe chaque route pour l'analyser
// ("collecting page data") sans jamais exécuter nos fonctions — construire le client
// (et le pool Neon) dès l'import ferait tourner cette connexion pendant l'analyse de
// build elle-même. On ne la crée donc qu'au premier accès réel, côté requête.
function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    return Reflect.get(getPrismaClient() as object, prop);
  },
});
