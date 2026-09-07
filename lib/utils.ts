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
 * Décode les entités HTML courantes dans une chaîne.
 */
export function decodeHtml(text: string): string {
  if (!text) return text;
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&laquo;/g, '«')
    .replace(/&raquo;/g, '»')
    .replace(/&eacute;/g, 'é')
    .replace(/&egrave;/g, 'è')
    .replace(/&agrave;/g, 'à')
    .replace(/&ocirc;/g, 'ô')
    .replace(/&ucirc;/g, 'û')
    .replace(/&icirc;/g, 'î')
    .replace(/&ccedil;/g, 'ç')
    .replace(/&Eacute;/g, 'É')
    .replace(/&Egrave;/g, 'È')
    .replace(/&Agrave;/g, 'À')
    .replace(/&Ocirc;/g, 'Ô')
    .replace(/&Ccedil;/g, 'Ç')
    .replace(/&euro;/g, '€')
    .replace(/&nbsp;/g, ' ')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&rsquo;/g, '\u2019')
    .replace(/&lsquo;/g, '\u2018')
    .replace(/&rdquo;/g, '\u201D')
    .replace(/&ldquo;/g, '\u201C')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

/**
 * Supprime les codes de référence préfixés dans les titres de marchés.
 * Ex : "2025-0154-00-00-MPF — Système d'acquisition..." → "Système d'acquisition..."
 * Ex : "110-26-01-RPPM — SAD 1 : ..." → "SAD 1 : ..."
 */
export function cleanTitle(title: string): string {
  if (!title) return title;
  // Pattern : code de référence (alphanum + tirets + underscores + points) suivi de " — " ou " – "
  const cleaned = title.replace(/^[A-Z0-9][A-Z0-9\-\._\/]{3,}\s+[—–]\s+/i, '').trim();
  return decodeHtml(cleaned);
}
