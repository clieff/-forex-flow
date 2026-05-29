// Fuseau horaire métier : Africa/Douala (Cameroun).
// Offset fixe UTC+1 toute l'année (pas de changement d'heure été/hiver).
export const APP_TIMEZONE = "Africa/Douala";

const OFFSET_MS = 60 * 60 * 1000; // UTC+1

/**
 * Renvoie l'année / le mois / le jour tels qu'observés à Africa/Douala,
 * quel que soit le fuseau du serveur (UTC en serverless).
 */
export function getZonedDateParts(date: Date = new Date()) {
  const shifted = new Date(date.getTime() + OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate()
  };
}
