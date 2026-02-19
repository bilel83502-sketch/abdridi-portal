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
