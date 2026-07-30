import { TEST_MODE } from "./config";

/**
 * Indirection unique pour "maintenant". En TEST_MODE, un override ISO (fourni par
 * l'appelant — ex. une valeur choisie dans le panneau de debug de /pointage et
 * transmise à chaque requête) permet de simuler une date/heure arbitraire sans
 * dépendre d'un état serveur, ce qui reste valide sur des fonctions serverless
 * sans état persistant entre invocations.
 */
export function now(overrideIso?: string | null): Date {
  if (TEST_MODE && overrideIso) {
    const parsed = new Date(overrideIso);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return new Date();
}
