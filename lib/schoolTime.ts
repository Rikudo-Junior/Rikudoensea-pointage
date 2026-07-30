// ENSEA est à Abidjan, Côte d'Ivoire (UTC+0 toute l'année, pas de changement d'heure).
const TIME_ZONE = "Africa/Abidjan";

/** Date calendaire (YYYY-MM-DD) de `date`, dans le fuseau de l'école quel que soit le fuseau du serveur. */
export function schoolDateString(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Heure locale (HH:MM:SS) de `date` dans le fuseau de l'école. */
export function schoolTimeString(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("hour")}:${get("minute")}:${get("second")}`;
}

/** Minutes depuis minuit, heure de l'école. Utilisé par lib/timeRules pour toutes les comparaisons horaires. */
export function schoolMinutesOfDay(date: Date): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return hour * 60 + minute;
}
