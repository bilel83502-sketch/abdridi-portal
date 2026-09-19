/**
 * Urgence d'une mission selon sa date limite de dépôt.
 *
 * En marchés publics, une date limite dépassée rend le dossier caduc :
 * ce n'est pas un détail visuel, c'est l'information la plus importante
 * de tout l'aperçu. Ce module centralise le calcul pour que l'admin
 * (Pilotage > Missions) et les commerciaux (Prospection) affichent
 * exactement la même urgence, de la même façon.
 */

export type UrgencyLevel = 'expired' | 'critical' | 'soon' | 'normal' | 'none';

export type Urgency = {
  level: UrgencyLevel;
  daysLeft: number | null;
  label: string;
};

export function getMissionUrgency(deadline: string | null | undefined): Urgency {
  if (!deadline) return { level: 'none', daysLeft: null, label: '' };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dl = new Date(deadline);
  dl.setHours(0, 0, 0, 0);

  const daysLeft = Math.round((dl.getTime() - today.getTime()) / 86400000);

  if (daysLeft < 0) {
    const since = Math.abs(daysLeft);
    return { level: 'expired', daysLeft, label: since === 1 ? 'Expirée hier' : `Expirée depuis ${since}j` };
  }
  if (daysLeft === 0) return { level: 'critical', daysLeft, label: "Dépôt aujourd'hui" };
  if (daysLeft === 1) return { level: 'critical', daysLeft, label: 'Dépôt demain' };
  if (daysLeft <= 3) return { level: 'critical', daysLeft, label: `J-${daysLeft}` };
  if (daysLeft <= 7) return { level: 'soon', daysLeft, label: `J-${daysLeft}` };
  return { level: 'normal', daysLeft, label: `J-${daysLeft}` };
}

export const URGENCY_STYLE: Record<UrgencyLevel, { bg: string; color: string; border: string }> = {
  expired:  { bg: 'rgba(100,116,139,0.15)', color: '#94A3B8', border: 'rgba(100,116,139,0.4)' },
  critical: { bg: 'rgba(239,68,68,0.15)',   color: '#EF4444', border: 'rgba(239,68,68,0.4)' },
  soon:     { bg: 'rgba(245,158,11,0.15)',  color: '#F59E0B', border: 'rgba(245,158,11,0.4)' },
  normal:   { bg: 'transparent',            color: '#94A3B8', border: 'transparent' },
  none:     { bg: 'transparent',            color: '#64748B', border: 'transparent' },
};

/**
 * Trie les missions par urgence : d'abord celles dont l'échéance approche
 * (la plus proche en tête), puis celles sans date renseignée, puis en
 * dernier les missions déjà expirées (encore visibles, mais reléguées car
 * il n'y a plus rien à en tirer).
 */
export function sortByUrgency<T extends { deadline: string | null | undefined }>(missions: T[]): T[] {
  const rank = (u: Urgency) => (u.level === 'expired' ? 2 : u.daysLeft === null ? 1 : 0);
  return [...missions].sort((a, b) => {
    const ua = getMissionUrgency(a.deadline);
    const ub = getMissionUrgency(b.deadline);
    const ra = rank(ua);
    const rb = rank(ub);
    if (ra !== rb) return ra - rb;
    if (ra === 0) return (ua.daysLeft ?? 0) - (ub.daysLeft ?? 0);
    if (ra === 2) return (ub.daysLeft ?? 0) - (ua.daysLeft ?? 0); // expirée la plus récente en premier
    return 0;
  });
}

/** Nombre de missions dont le dépôt approche (≤7 jours) et n'est pas encore expiré. */
export function countUrgent<T extends { deadline: string | null | undefined }>(missions: T[]): number {
  return missions.filter(m => {
    const u = getMissionUrgency(m.deadline);
    return u.level === 'critical' || u.level === 'soon';
  }).length;
}
