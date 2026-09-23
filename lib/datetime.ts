/**
 * Dates saisies par les utilisateurs — toujours interprétées en heure de Paris.
 *
 * Les champs <input type="datetime-local"> renvoient "2026-09-24T14:00", sans
 * fuseau. `new Date(...)` côté serveur les lit alors dans le fuseau du serveur
 * — UTC sur Vercel — ce qui décalait tous les rendez-vous de 2 heures l'été
 * (1 heure l'hiver). On force donc l'interprétation en Europe/Paris.
 */

const TZ = 'Europe/Paris';

/** Décalage (en minutes) d'Europe/Paris par rapport à UTC à cet instant précis. */
export function parisOffsetMinutes(at: Date): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const p: Record<string, number> = {};
  for (const part of dtf.formatToParts(at)) {
    if (part.type !== 'literal') p[part.type] = parseInt(part.value, 10);
  }
  const asUTC = Date.UTC(p.year, p.month - 1, p.day, p.hour % 24, p.minute, p.second);
  return Math.round((asUTC - at.getTime()) / 60000);
}

/**
 * Convertit une saisie utilisateur en instant absolu.
 * - "2026-09-24T14:00"  → 14h00 heure de Paris
 * - "2026-09-24"        → 09h00 heure de Paris (heure par défaut d'un rappel)
 * - déjà horodatée (Z ou +02:00) → inchangée
 */
export function parseUserDateTime(input: string | Date | null | undefined): Date | null {
  if (!input) return null;
  if (input instanceof Date) return isNaN(input.getTime()) ? null : input;

  const s = String(input).trim();
  if (/([zZ]|[+-]\d{2}:?\d{2})$/.test(s)) {
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/);
  if (!m) {
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  const [, Y, M, D, h, mi] = m;
  const hasTime = h !== undefined;
  const naiveUTC = Date.UTC(+Y, +M - 1, +D, hasTime ? +h : 9, hasTime ? +mi : 0);

  // Deux passes : le décalage dépend de la date (heure d'été / d'hiver).
  let ts = naiveUTC - parisOffsetMinutes(new Date(naiveUTC)) * 60000;
  const off2 = parisOffsetMinutes(new Date(ts));
  ts = naiveUTC - off2 * 60000;
  return new Date(ts);
}

/** "mercredi 24 septembre 2026 à 14:00" (heure de Paris). */
export function formatFrDateTime(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(date).replace(' à ', ' à ');
}

/** "14:00" (heure de Paris). */
export function formatFrTime(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return new Intl.DateTimeFormat('fr-FR', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }).format(date);
}
