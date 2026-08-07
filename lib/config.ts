// Constantes de configuration métier — toutes surchargeables via variables d'environnement.
// Coordonnées GPS exactes du campus ENSEA (Avenue des Grandes Écoles, Cocody, Abidjan),
// vérifiées via OpenStreetMap (nœud "École Nationale Supérieure de Statistique et
// d'Economie Appliquée", à cette adresse).

export const SCHOOL_LAT = Number(process.env.SCHOOL_LAT ?? "5.3491152");
export const SCHOOL_LON = Number(process.env.SCHOOL_LON ?? "-3.9890944");
export const RADIUS_M = Number(process.env.RADIUS_M ?? 250);

export const MORNING_WINDOW = { start: "06:00", end: "12:00" };
export const EVENING_WINDOW = { start: "13:00", end: "22:00" };

export const MIN_DURATION_HOURS = 2.5;
export const NOMINAL_START = "08:00";
export const NOMINAL_END = "17:30";

// Période de stage par défaut, utilisée tant que le directeur des études n'a pas défini
// les dates de l'édition en cours depuis le dashboard (voir lib/directeur.ts::getStageDates).
export const STAGE_START_DATE = process.env.STAGE_START_DATE ?? "2026-08-10";
export const STAGE_END_DATE = process.env.STAGE_END_DATE ?? "2026-08-28";

// Domaine des stagiaires (élèves). Le domaine @ensea.ed.ci (personnel/encadrants) n'est
// volontairement pas autorisé ici : seuls les stagiaires pointent via cette app.
export const ALLOWED_EMAIL_DOMAIN = process.env.ALLOWED_EMAIL_DOMAIN ?? "ensea.edu.ci";
export const TEST_MODE = process.env.TEST_MODE === "true";

export const SESSION_COOKIE_NAME = "ensea_session";
export const DASHBOARD_COOKIE_NAME = "ensea_dashboard";
export const TEST_NOW_COOKIE_NAME = "ensea_test_now";
export const PENDING_VERIFICATION_COOKIE_NAME = "ensea_pending";

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 90; // 90 jours
export const DASHBOARD_MAX_AGE_SECONDS = 60 * 60 * 12; // 12 heures

export const VERIFICATION_CODE_TTL_SECONDS = 60 * 10; // 10 minutes
export const VERIFICATION_MAX_ATTEMPTS = 5;

export const GOOGLE_SHEET_ID = TEST_MODE
  ? process.env.GOOGLE_SHEET_ID_TEST ?? process.env.GOOGLE_SHEET_ID
  : process.env.GOOGLE_SHEET_ID;

// Rapport de fin de journée : justificatif PDF joint par le stagiaire au pointage de départ.
// Plafonné sous la limite de taille de requête des fonctions serverless Vercel (~4,5 Mo) :
// au-delà, la plateforme rejette la requête avant même d'atteindre ce handler.
export const MAX_RAPPORT_PDF_BYTES = 4 * 1024 * 1024; // 4 Mo
