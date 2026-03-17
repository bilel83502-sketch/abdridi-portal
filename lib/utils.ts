export function formatCurrency(v: number | null | undefined): string {
  if (!v) return '—';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
}
export function formatDate(d: Date | string | null): string {
  if (!d) return '—';
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(d));
}
export function daysUntil(d: Date | string | null): number | null {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}
export function getNatureLabel(n: string) {
  return { TRAVAUX: 'Travaux', FOURNITURES: 'Fournitures', SERVICES: 'Services' }[n] || n;
}
export function getNatureBadge(n: string) {
  return { TRAVAUX: 'badge-travaux', FOURNITURES: 'badge-fournitures', SERVICES: 'badge-services' }[n] || '';
}

/**
 * Supprime les codes de référence préfixés dans les titres de marchés.
 * Ex : "2025-0154-00-00-MPF — Système d'acquisition..." → "Système d'acquisition..."
 * Ex : "110-26-01-RPPM — SAD 1 : ..." → "SAD 1 : ..."
 */
export function cleanTitle(title: string): string {
  if (!title) return title;
  // Pattern : code sans espaces (≥4 chars alphanum+tirets) suivi de " — " ou " – "
  return title.replace(/^[A-Z0-9][A-Z0-9\-\.\/]{3,}\s+[—–]\s+/i, '').trim();
}
