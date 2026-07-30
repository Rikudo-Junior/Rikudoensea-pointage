import { createHash } from "crypto";

/**
 * Hache le code de vérification (jamais stocké/transmis en clair) avec le secret de
 * session comme sel. Module séparé de lib/session.ts car il utilise le module Node
 * `crypto`, indisponible en Edge runtime (où tourne middleware.ts).
 */
export function hashVerificationCode(code: string): string {
  const secret = process.env.SESSION_SECRET ?? "";
  return createHash("sha256").update(`${secret}:${code}`).digest("hex");
}
