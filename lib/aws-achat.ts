/**
 * AWS-Achat (AW Solutions) — marches-publics.info
 * https://www.marches-publics.info
 *
 * Méthode : scraping HTML via POST sur /Annonces/lister
 * Body : IDE=EC&IDN=X&IDR=X&motsCles=
 * Pagination : liens "page=" dans le HTML
 * Site ColdFusion — encodage potentiellement ISO-8859-1
 */

import * as cheerio from 'cheerio';

const BASE_URL = 'https://www.marches-publics.info';
const LIST_URL = `${BASE_URL}/Annonces/lister`;
const PAGE_SIZE = 20;
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

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
export interface AwsAchatMarche {
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

/* ───── Parser le HTML avec cheerio ───── */
function parseResultsHtml(html: string): AwsAchatMarche[] {
  const results: AwsAchatMarche[] = [];
  const $ = cheerio.load(html, { decodeEntities: true });

  // The site lists announcements in table rows or divs
  // Look for announcement blocks — adapt selectors based on actual structure
  $('table.resultats tr, table.listeAnnonces tr, .annonce, tr.pair, tr.impair, table tr[class]').each((_, el) => {
    const row = $(el);
    const cells = row.find('td');
    if (cells.length < 3) return;

    // Try to extract a detail link with reference
    const link = row.find('a[href*="Annonces"]').first();
    const href = link.attr('href') || '';
    const refMatch = href.match(/idAnnonce=(\d+)/i) || href.match(/(\d{6,})/);
    if (!refMatch) return;
    const ref = refMatch[1];

    const title = (link.text() || cells.eq(1).text() || '').trim();
    if (!title) return;

    const buyer = (cells.eq(0).text() || cells.eq(2).text() || '').trim();

    // Try to find date (DD/MM/YYYY)
    let deadline: Date | null = null;
    const fullText = row.text();
    const dateMatch = fullText.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (dateMatch) {
      deadline = new Date(`${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}T12:00:00+01:00`);
    }

    // Try to find department code
    let dept = '00';
    const deptMatch = fullText.match(/\b(97[1-6]|0[1-9]|[1-8]\d|9[0-5]|2[AB])\b/);
    if (deptMatch) dept = deptMatch[1];
    const deptInfo = DEPT_MAP[dept];

    // Try to find nature
    const nature = mapNature(fullText);

    results.push({
      title: title.slice(0, 500),
      buyer: buyer.slice(0, 300) || 'AWS-Achat',
      nature,
      department: dept,
      departmentName: deptInfo?.name || null,
      region: deptInfo?.region || null,
      value: null,
      deadline,
      publicationDate: null,
      source: 'AWS-ACHAT',
      sourceRef: `AWS-${ref}`,
      procedureType: null,
      cpvCode: null,
      cpvLabel: null,
      lots: 1,
      duration: null,
      status: 'OUVERT',
    });
  });

  return results;
}

/* ───── Extract total pages from pagination ───── */
function extractTotalPages(html: string): number {
  const matches = html.match(/page=(\d+)/g);
  if (!matches) return 1;
  let max = 1;
  for (const m of matches) {
    const n = parseInt(m.replace('page=', ''));
    if (n > max) max = n;
  }
  return max;
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

/* ───── Décoder le body ISO-8859-1 si nécessaire ───── */
async function decodeResponseText(res: Response): Promise<string> {
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('iso-8859-1') || contentType.includes('latin1') || contentType.includes('windows-1252')) {
    const buf = await res.arrayBuffer();
    const decoder = new TextDecoder('iso-8859-1');
    return decoder.decode(buf);
  }
  return res.text();
}

/* ───── Fonction principale ───── */
export async function fetchAwsAchatRecords(options?: {
  limit?: number;
}): Promise<AwsAchatMarche[]> {
  const limit = options?.limit ?? 200;
  const allRecords: AwsAchatMarche[] = [];

  console.log(`[AWS] Fetching annonces from marches-publics.info...`);

  // Step 1: POST to get first page
  const body = 'IDE=EC&IDN=X&IDR=X&motsCles=';
  const headers: Record<string, string> = {
    'User-Agent': UA,
    'Content-Type': 'application/x-www-form-urlencoded',
    Accept: 'text/html,application/xhtml+xml',
    Referer: `${BASE_URL}/`,
  };

  const firstRes = await fetchWithRetry(LIST_URL, {
    method: 'POST',
    headers,
    body,
  });

  if (!firstRes) {
    console.error('[AWS] Failed to fetch first page');
    // TODO: Si bot-detection bloque, investiguer les cookies/captcha ColdFusion
    return [];
  }

  const firstHtml = await decodeResponseText(firstRes);
  const firstRecords = parseResultsHtml(firstHtml);
  allRecords.push(...firstRecords);

  const totalPages = extractTotalPages(firstHtml);
  console.log(`[AWS] Page 1: ${firstRecords.length} items, ${totalPages} pages total`);

  // Step 2: Paginate
  const maxPagesNeeded = Math.ceil(limit / PAGE_SIZE);
  const pagesToFetch = Math.min(totalPages, maxPagesNeeded);

  for (let page = 2; page <= pagesToFetch && allRecords.length < limit; page++) {
    await new Promise((r) => setTimeout(r, 1500));

    const pageBody = `${body}&page=${page}`;
    const res = await fetchWithRetry(LIST_URL, {
      method: 'POST',
      headers,
      body: pageBody,
    });

    if (!res) {
      // Try GET with page param as fallback
      const getRes = await fetchWithRetry(`${LIST_URL}?page=${page}&IDE=EC&IDN=X&IDR=X`, {
        headers: { 'User-Agent': UA },
      });
      if (!getRes) {
        console.warn(`[AWS] Page ${page} failed, skipping`);
        continue;
      }
      const html = await decodeResponseText(getRes);
      const records = parseResultsHtml(html);
      allRecords.push(...records);
      console.log(`[AWS] Page ${page} (GET): ${records.length} items (total: ${allRecords.length})`);
      continue;
    }

    const html = await decodeResponseText(res);
    const records = parseResultsHtml(html);

    if (records.length === 0) {
      console.log(`[AWS] No results on page ${page}, stopping`);
      break;
    }

    allRecords.push(...records);
    console.log(`[AWS] Page ${page}: ${records.length} items (total: ${allRecords.length})`);
  }

  // Deduplicate by sourceRef
  const seen = new Set<string>();
  const unique = allRecords.filter((r) => {
    if (seen.has(r.sourceRef)) return false;
    seen.add(r.sourceRef);
    return true;
  });

  console.log(`[AWS] Total records mapped: ${unique.length}`);
  return unique.slice(0, limit);
}
