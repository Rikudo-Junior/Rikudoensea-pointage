import { prisma } from "./db";
import type { Classe } from "./classes";

export interface UserRecord {
  id: string;
  email: string;
  prenom: string;
  nom: string;
  passwordHash: string;
  classe: Classe;
  statut: "actif" | "desactive";
  createdAt: Date;
}

function toUserRecord(user: {
  id: string;
  email: string;
  prenom: string;
  nom: string;
  passwordHash: string;
  classe: string;
  statut: string;
  createdAt: Date;
}): UserRecord {
  return {
    id: user.id,
    email: user.email,
    prenom: user.prenom,
    nom: user.nom,
    passwordHash: user.passwordHash,
    classe: user.classe as Classe,
    statut: user.statut === "desactive" ? "desactive" : "actif",
    createdAt: user.createdAt,
  };
}

export async function getUserByEmail(email: string): Promise<UserRecord | null> {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  return user ? toUserRecord(user) : null;
}

export async function getAllUsers(): Promise<UserRecord[]> {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
  return users.map(toUserRecord);
}

export async function updatePassword(userId: string, passwordHash: string): Promise<void> {
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
}

export async function setUserStatut(email: string, statut: "actif" | "desactive"): Promise<void> {
  await prisma.user.update({ where: { email: email.toLowerCase() }, data: { statut } });
}

export async function createUser(input: {
  email: string;
  prenom: string;
  nom: string;
  passwordHash: string;
  classe: Classe;
}): Promise<UserRecord> {
  const user = await prisma.user.create({
    data: {
      email: input.email.toLowerCase(),
      prenom: input.prenom,
      nom: input.nom,
      passwordHash: input.passwordHash,
      classe: input.classe,
    },
  });
  return toUserRecord(user);
}
