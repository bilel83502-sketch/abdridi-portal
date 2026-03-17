/**
 * Marchés Online — marchesonline.com
 *
 * Le site est un SPA Nuxt, mais le sitemap /sitemap/appel_offres-01.xml
 * contient ~5000 URLs de détail server-rendered.
 * Stratégie : lire le sitemap, scraper les N premières pages de détail,
 * parser le HTML pour extraire les données de chaque avis.
 */

import * as cheerio from 'cheerio';

const BASE_URL = 'https://www.marchesonline.com';
const SITEMAP_URL = `${BASE_URL}/sitemap/appel_offres-01.xml`;
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
const CONCURRENCY = 3;

/* ───── Mapping département → nom + région ───── */
const DEPT_MAP: Record<string, { name: string; region: string }> = {
  '01': { name: 'Ain', region: 'Auvergne-Rhône-Alpes' },
  '02': { name: 'Aisne', region: 'Hauts-de-France' },
  '03': { name: 'Allier', region: 'Auvergne-Rhône-Alpes' },
  '04': { name: 'Alpes-de-Haute-Provence', region: 'PACA' },
  '05': { name: 'Hautes-Alpes', region: 'PACA' },
  '06': { name: 'Alpes-Maritimes', region: 'PACA' },
  '07': { name: 'Ardèche', region: 'Auvergne-Rhône-Alpes' },
  '08': { name: 'Ardennes', region: 'Grand Est' },
  '09': { name: 'Ariège', region: 'Occitanie' },
  '10': { name: 'Aube', region: 'Grand Est' },
  '11': { name: 'Aude', region: 'Occitanie' },
  '12': { name: 'Aveyron', region: 'Occitanie' },
  '13': { name: 'Bouches-du-Rhône', region: 'PACA' },
  '14': { name: 'Calvados', region: 'Normandie' },
  '15': { name: 'Cantal', region: 'Auvergne-Rhône-Alpes' },
  '16': { name: 'Charente', region: 'Nouvelle-Aquitaine' },
  '17': { name: 'Charente-Maritime', region: 'Nouvelle-Aquitaine' },
  '18': { name: 'Cher', region: 'Centre-Val de Loire' },
  '19': { name: 'Corrèze', region: 'Nouvelle-Aquitaine' },
  '21': { name: "Côte-d'Or", region: 'Bourgogne-Franche-Comté' },
  '22': { name: "Côtes-d'Armor", region: 'Bretagne' },
  '23': { name: 'Creuse', region: 'Nouvelle-Aquitaine' },
  '24': { name: 'Dordogne', region: 'Nouvelle-Aquitaine' },
  '25': { name: 'Doubs', region: 'Bourgogne-Franche-Comté' },
  '26': { name: 'Drôme', region: 'Auvergne-Rhône-Alpes' },
  '27': { name: 'Eure', region: 'Normandie' },
  '28': { name: 'Eure-et-Loir', region: 'Centre-Val de Loire' },
  '29': { name: 'Finistère', region: 'Bretagne' },
  '2A': { name: 'Corse-du-Sud', region: 'Corse' },
  '2B': { name: 'Haute-Corse', region: 'Corse' },
  '30': { name: 'Gard', region: 'Occitanie' },
  '31': { name: 'Haute-Garonne', region: 'Occitanie' },
  '32': { name: 'Gers', region: 'Occitanie' },
  '33': { name: 'Gironde', region: 'Nouvelle-Aquitaine' },
  '34': { name: 'Hérault', region: 'Occitanie' },
  '35': { name: 'Ille-et-Vilaine', region: 'Bretagne' },
  '36': { name: 'Indre', region: 'Centre-Val de Loire' },
  '37': { name: 'Indre-et-Loire', region: 'Centre-Val de Loire' },
  '38': { name: 'Isère', region: 'Auvergne-Rhône-Alpes' },
  '39': { name: 'Jura', region: 'Bourgogne-Franche-Comté' },
  '40': { name: 'Landes', region: 'Nouvelle-Aquitaine' },
  '41': { name: 'Loir-et-Cher', region: 'Centre-Val de Loire' },
  '42': { name: 'Loire', region: 'Auvergne-Rhône-Alpes' },
  '43': { name: 'Haute-Loire', region: 'Auvergne-Rhône-Alpes' },
  '44': { name: 'Loire-Atlantique', region: 'Pays de la Loire' },
  '45': { name: 'Loiret', region: 'Centre-Val de Loire' },
  '46': { name: 'Lot', region: 'Occitanie' },
  '47': { name: 'Lot-et-Garonne', region: 'Nouvelle-Aquitaine' },
  '48': { name: 'Lozère', region: 'Occitanie' },
  '49': { name: 'Maine-et-Loire', region: 'Pays de la Loire' },
  '50': { name: 'Manche', region: 'Normandie' },
  '51': { name: 'Marne', region: 'Grand Est' },
  '52': { name: 'Haute-Marne', region: 'Grand Est' },
  '53': { name: 'Mayenne', region: 'Pays de la Loire' },
  '54': { name: 'Meurthe-et-Moselle', region: 'Grand Est' },
  '55': { name: 'Meuse', region: 'Grand Est' },
  '56': { name: 'Morbihan', region: 'Bretagne' },
  '57': { name: 'Moselle', region: 'Grand Est' },
  '58': { name: 'Nièvre', region: 'Bourgogne-Franche-Comté' },
  '59': { name: 'Nord', region: 'Hauts-de-France' },
  '60': { name: 'Oise', region: 'Hauts-de-France' },
  '61': { name: 'Orne', region: 'Normandie' },
  '62': { name: 'Pas-de-Calais', region: 'Hauts-de-France' },
  '63': { name: 'Puy-de-Dôme', region: 'Auvergne-Rhône-Alpes' },
  '64': { name: 'Pyrénées-Atlantiques', region: 'Nouvelle-Aquitaine' },
  '65': { name: 'Hautes-Pyrénées', region: 'Occitanie' },
  '66': { name: 'Pyrénées-Orientales', region: 'Occitanie' },
  '67': { name: 'Bas-Rhin', region: 'Grand Est' },
  '68': { name: 'Haut-Rhin', region: 'Grand Est' },
  '69': { name: 'Rhône', region: 'Auvergne-Rhône-Alpes' },
  '70': { name: 'Haute-Saône', region: 'Bourgogne-Franche-Comté' },
  '71': { name: 'Saône-et-Loire', region: 'Bourgogne-Franche-Comté' },
  '72': { name: 'Sarthe', region: 'Pays de la Loire' },
  '73': { name: 'Savoie', region: 'Auvergne-Rhône-Alpes' },
  '74': { name: 'Haute-Savoie', region: 'Auvergne-Rhône-Alpes' },
  '75': { name: 'Paris', region: 'Île-de-France' },
  '76': { name: 'Seine-Maritime', region: 'Normandie' },
  '77': { name: 'Seine-et-Marne', region: 'Île-de-France' },
  '78': { name: 'Yvelines', region: 'Île-de-France' },
  '79': { name: 'Deux-Sèvres', region: 'Nouvelle-Aquitaine' },
  '80': { name: 'Somme', region: 'Hauts-de-France' },
  '81': { name: 'Tarn', region: 'Occitanie' },
  '82': { name: 'Tarn-et-Garonne', region: 'Occitanie' },
  '83': { name: 'Var', region: 'PACA' },
  '84': { name: 'Vaucluse', region: 'PACA' },
  '85': { name: 'Vendée', region: 'Pays de la Loire' },
  '86': { name: 'Vienne', region: 'Nouvelle-Aquitaine' },
  '87': { name: 'Haute-Vienne', region: 'Nouvelle-Aquitaine' },
  '88': { name: 'Vosges', region: 'Grand Est' },
  '89': { name: 'Yonne', region: 'Bourgogne-Franche-Comté' },
  '90': { name: 'Territoire de Belfort', region: 'Bourgogne-Franche-Comté' },
  '91': { name: 'Essonne', region: 'Île-de-France' },
  '92': { name: 'Hauts-de-Seine', region: 'Île-de-France' },
  '93': { name: 'Seine-Saint-Denis', region: 'Île-de-France' },
  '94': { name: 'Val-de-Marne', region: 'Île-de-France' },
  '95': { name: "Val-d'Oise", region: 'Île-de-France' },
  '971': { name: 'Guadeloupe', region: 'Outre-Mer' },
  '972': { name: 'Martinique', region: 'Outre-Mer' },
  '973': { name: 'Guyane', region: 'Outre-Mer' },
  '974': { name: 'La Réunion', region: 'Outre-Mer' },
  '976': { name: 'Mayotte', region: 'Outre-Mer' },
};

/* ───── Mapping nature ───── */
function mapNature(raw: string): string {
  const t = raw.toUpperCase();
  if (t.includes('TRAVAUX')) return 'TRAVAUX';
  if (t.includes('FOURNITURE')) return 'FOURNITURES';
  if (t.includes('SERVICE')) return 'SERVICES';
  return 'SERVICES';
}

/* ───── Type retour ───── */
export interface MarchesOnlineMarche {
  title: string;
  buyer: string;
  nature: string;
  department: string;
  departmentName: string | null;
  region: string | null;
  value: number | null;
  deadline: Date | null;
  publicationDate: Date | null;
  source: string;
  sourceRef: string;
  procedureType: string | null;
  cpvCode: string | null;
  cpvLabel: string | null;
  lots: number;
  duration: string | null;
  status: string;
}

/* ───── Fetch avec retry ───── */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3,
): Promise<Response | null> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;
      if (attempt === maxRetries) return null;
    } catch {
      if (attempt === maxRetries) return null;
    }
    await new Promise((r) => setTimeout(r, 1000 * attempt));
  }
  return null;
}

/* ───── Fetch sitemap et extraire les URLs ───── */
async function fetchSitemapUrls(): Promise<{ url: string; id: string }[]> {
  const res = await fetchWithRetry(SITEMAP_URL, {
    headers: { 'User-Agent': UA, Accept: 'text/xml,application/xml' },
  });
  if (!res) return [];
  const xml = await res.text();

  const results: { url: string; id: string }[] = [];
  const locMatches = xml.match(/<loc>([^<]+)<\/loc>/g) || [];
  for (const loc of locMatches) {
    const url = loc.replace(/<\/?loc>/g, '').trim();
    // URL format: .../ao-{id}-{num}
    const idMatch = url.match(/ao-(\d+)-\d+$/);
    if (idMatch) {
      results.push({ url, id: idMatch[1] });
    }
  }
  return results;
}

/* ───── Parser une page de détail MO ───── */
function parseDetailPage(html: string, id: string, pageUrl: string): MarchesOnlineMarche | null {
  const $ = cheerio.load(html);

  // Title from h1
  const title = $('h1').first().text().replace(/\s+/g, ' ').trim().replace(/\.$/, '');
  if (!title) return null;

  // The main content is in a div with class "limit-descript-height" or "descript-line"
  const contentDiv = $('[class*="limit-descript-height"], [class*="descript-line"]').first();
  const text = contentDiv.length
    ? contentDiv.text().replace(/\s+/g, ' ')
    : $('body').text().replace(/\s+/g, ' ');

  // Buyer: "Nom officiel : ..."
  const buyerMatch = text.match(/Nom officiel\s*:\s*([^§]+?)(?:\s*Forme juridique|\s*Numéro d'enregistrement|\s*Section)/);
  const buyer = buyerMatch ? buyerMatch[1].trim().slice(0, 300) : 'Marchés Online';

  // Department: "Département(s) de publication :XX, YY"
  let dept = '00';
  const deptMatch = text.match(/D[ée]partement\(?s?\)?\s*de publication\s*:\s*([^A-Z§]+)/i);
  if (deptMatch) {
    const firstDept = deptMatch[1].trim().split(/[,\s]+/)[0];
    if (firstDept && /^\d{2,3}$/.test(firstDept)) dept = firstDept;
  }
  // Fallback: Code postal from "Code postal : XXXXX"
  if (dept === '00') {
    const cpMatch = text.match(/Code postal\s*:\s*(\d{5})/);
    if (cpMatch) {
      const cp = cpMatch[1];
      dept = cp.startsWith('97') ? cp.slice(0, 3) : cp.slice(0, 2);
    }
  }
  const deptInfo = DEPT_MAP[dept];

  // Nature: "Nature du marché : Services/Travaux/Fournitures"
  let nature = 'SERVICES';
  const natureMatch = text.match(/Nature du march[ée]\s*:\s*(\w+)/i);
  if (natureMatch) nature = mapNature(natureMatch[1]);

  // Deadline: "Date limite de réception des offres : DD/MM/YYYY"
  let deadline: Date | null = null;
  // Search in raw HTML to handle span tags
  const deadlineHtmlMatch = html.match(/[Rr][ée]ception des offres\s*(?:<[^>]*>)?\s*:?\s*(?:<[^>]*>)?\s*(\d{2})\/(\d{2})\/(\d{4})/);
  if (deadlineHtmlMatch) {
    const d = new Date(`${deadlineHtmlMatch[3]}-${deadlineHtmlMatch[2]}-${deadlineHtmlMatch[1]}T12:00:00+01:00`);
    if (!isNaN(d.getTime())) deadline = d;
  }

  // CPV: "cpv ): XXXXXXXX Label"
  let cpvCode: string | null = null;
  let cpvLabel: string | null = null;
  const cpvMatch = text.match(/Nomenclature principale\s*\(\s*cpv\s*\)\s*:\s*(\d{8})\s+([^§]+?)(?:\s*Nomenclature|\s*\d\.\d)/);
  if (cpvMatch) {
    cpvCode = cpvMatch[1];
    cpvLabel = cpvMatch[2].trim().slice(0, 200);
  }

  // Value: "Valeur estimée hors TVA : XXX Euro"
  let value: number | null = null;
  const valMatch = text.match(/Valeur estim[ée]e[^:]*:\s*([\d\s,.]+)\s*Euro/i);
  if (valMatch) {
    let raw = valMatch[1].replace(/\s/g, '');
    // Handle "136,000,000" (thousand-separator commas) vs "1234,56" (decimal comma)
    const commaCount = (raw.match(/,/g) || []).length;
    if (commaCount > 1) {
      // Multiple commas = thousand separators
      raw = raw.replace(/,/g, '');
    } else if (commaCount === 1) {
      // Single comma: check if it's a decimal (e.g. "1234,56") or thousand separator (e.g. "1,000")
      const afterComma = raw.split(',')[1];
      if (afterComma.length === 3) {
        raw = raw.replace(',', ''); // thousand separator
      } else {
        raw = raw.replace(',', '.'); // decimal
      }
    }
    const v = parseFloat(raw);
    if (!isNaN(v) && v > 0) value = v;
  }

  // Procedure type: "Type de procédure : Ouverte"
  let procedureType: string | null = null;
  const procMatch = text.match(/Type de proc[ée]dure\s*:\s*(\w[\w\s]*?)(?:\s*La proc|$)/i);
  if (procMatch) procedureType = procMatch[1].trim().slice(0, 100);

  // Duration: "Durée : XX Mois"
  let duration: string | null = null;
  const durMatch = text.match(/Dur[ée]e\s*:\s*(\d+\s*\w+)/i);
  if (durMatch) duration = durMatch[1].trim();

  // Lots: count "Identifiant technique du lot"
  const lotsCount = (text.match(/Identifiant technique du lot/g) || []).length;

  return {
    title: title.slice(0, 500),
    buyer,
    nature,
    department: dept,
    departmentName: deptInfo?.name || null,
    region: deptInfo?.region || null,
    value,
    deadline,
    publicationDate: null,
    source: 'MARCHES-ONLINE',
    sourceRef: `MO-${id}`,
    procedureType,
    cpvCode,
    cpvLabel,
    lots: lotsCount || 1,
    duration,
    status: 'OUVERT',
  };
}

/* ───── Fetch un batch d'URLs en parallèle avec concurrence limitée ───── */
async function fetchBatch(
  urls: { url: string; id: string }[],
): Promise<MarchesOnlineMarche[]> {
  const results: MarchesOnlineMarche[] = [];
  const headers = { 'User-Agent': UA, Accept: 'text/html' };

  for (let i = 0; i < urls.length; i += CONCURRENCY) {
    const batch = urls.slice(i, i + CONCURRENCY);
    const promises = batch.map(async ({ url, id }) => {
      const res = await fetchWithRetry(url, { headers }, 2);
      if (!res) return null;
      const html = await res.text();
      return parseDetailPage(html, id, url);
    });

    const batchResults = await Promise.all(promises);
    for (const r of batchResults) {
      if (r) results.push(r);
    }

    // Throttle between batches
    if (i + CONCURRENCY < urls.length) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  return results;
}

/* ───── Fonction principale ───── */
export async function fetchMarchesOnlineRecords(options?: {
  limit?: number;
}): Promise<MarchesOnlineMarche[]> {
  const limit = options?.limit ?? 200;

  console.log(`[MONL] Fetching sitemap from marchesonline.com...`);
  const sitemapUrls = await fetchSitemapUrls();
  console.log(`[MONL] Sitemap: ${sitemapUrls.length} URLs found`);

  if (sitemapUrls.length === 0) {
    console.error('[MONL] No URLs found in sitemap');
    return [];
  }

  // Take the first N URLs (they're the most recent in the sitemap)
  const urlsToFetch = sitemapUrls.slice(0, limit);
  console.log(`[MONL] Fetching ${urlsToFetch.length} detail pages...`);

  const records = await fetchBatch(urlsToFetch);
  console.log(`[MONL] Parsed ${records.length} records from ${urlsToFetch.length} pages`);

  // Deduplicate by sourceRef
  const seen = new Set<string>();
  const unique = records.filter((r) => {
    if (seen.has(r.sourceRef)) return false;
    seen.add(r.sourceRef);
    return true;
  });

  console.log(`[MONL] Total unique records: ${unique.length}`);
  return unique;
}
