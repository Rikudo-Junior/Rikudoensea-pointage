import { jwtVerify, SignJWT } from "jose";
import {
  DASHBOARD_MAX_AGE_SECONDS,
  SESSION_MAX_AGE_SECONDS,
  VERIFICATION_CODE_TTL_SECONDS,
} from "./config";

// Ce module n'utilise que `jose` (Web Crypto), donc reste importable depuis middleware.ts
// (Edge runtime). Le hachage du code de vérification (lib/codeHash.ts) utilise le module
// Node `crypto` et est volontairement séparé pour ne jamais finir dans ce bundle edge.

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET manquant.");
  return new TextEncoder().encode(secret);
}

// ---------- Session stagiaire (identité vérifiée) ----------

export interface SessionPayload {
  userId: string;
  email: string;
  prenom: string;
  nom: string;
}

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (
      typeof payload.userId !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.prenom !== "string" ||
      typeof payload.nom !== "string"
    ) {
      return null;
    }
    return {
      userId: payload.userId,
      email: payload.email,
      prenom: payload.prenom,
      nom: payload.nom,
    };
  } catch {
    return null;
  }
}

// ---------- Vérification en attente (code envoyé par email) ----------

export interface PendingVerificationPayload {
  email: string;
  prenom: string;
  nom: string;
  classe: string;
  codeHash: string;
  passwordHash: string;
  attempts: number;
}

export async function signPendingVerification(
  payload: PendingVerificationPayload,
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${VERIFICATION_CODE_TTL_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifyPendingVerification(
  token: string,
): Promise<PendingVerificationPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (
      typeof payload.email !== "string" ||
      typeof payload.prenom !== "string" ||
      typeof payload.nom !== "string" ||
      typeof payload.classe !== "string" ||
      typeof payload.codeHash !== "string" ||
      typeof payload.passwordHash !== "string" ||
      typeof payload.attempts !== "number"
    ) {
      return null;
    }
    return {
      email: payload.email,
      prenom: payload.prenom,
      nom: payload.nom,
      classe: payload.classe,
      codeHash: payload.codeHash,
      passwordHash: payload.passwordHash,
      attempts: payload.attempts,
    };
  } catch {
    return null;
  }
}

// ---------- Session responsable (dashboard) ----------

export async function signDashboardToken(): Promise<string> {
  return new SignJWT({ role: "responsable" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${DASHBOARD_MAX_AGE_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifyDashboardToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload.role === "responsable";
  } catch {
    return false;
  }
}
