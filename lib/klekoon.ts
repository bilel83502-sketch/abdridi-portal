/**
 * Klekoon — klekoon.com
 * https://www.klekoon.com
 *
 * Méthode : scraping HTML des pages acheteurs publics
 * Les pages acheteurs affichent les données complètes (titre, émetteur, département, dates)
 * sans paywall, contrairement aux résultats de recherche qui sont floutés.
 *
 * Étape 1 : récupérer la liste des acheteurs depuis /liste-annonces-acheteur-public
 * Étape 2 : pour chaque acheteur, scraper les annonces depuis /appel-offres/acheteurs-publics/{slug}-{id}
 */

import * as cheerio from 'cheerio';

const BASE_URL = 'https://www.klekoon.com';
const BUYERS_URL = `${BASE_URL}/liste-annonces-acheteur-public`;
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
export interface KlekoonMarche {
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

/* ───── Parse une date DD/MM/YYYY ───── */
function parseFrDate(str: string): Date | null {
  const m = str.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!m) return null;
  return new Date(`${m[3]}-${m[2]}-${m[1]}T12:00:00+01:00`);
}

/* ───── Extraire le département depuis le texte émetteur "NOM (XX)" ───── */
function extractDept(emetteur: string): string {
  const m = emetteur.match(/\((\d{2,3}[AB]?)\)\s*$/);
  if (m) return m[1];
  return '00';
}

/* ───── Récupérer les URLs des acheteurs ───── */
async function fetchBuyerUrls(maxBuyers: number): Promise<string[]> {
  const headers = { 'User-Agent': UA };
  const res = await fetchWithRetry(BUYERS_URL, { headers });
  if (!res) {
    console.error('[KLEKOON] Failed to fetch buyer list');
    return [];
  }

  const html = await res.text();
  const $ = cheerio.load(html);
  const urls: string[] = [];

  $('a[href*="/appel-offres/acheteurs-publics/"]').each((_, el) => {
    const href = $(el).attr('href');
    if (href && !urls.includes(href)) {
      urls.push(href.startsWith('http') ? href : `${BASE_URL}${href}`);
    }
  });

  console.log(`[KLEKOON] Found ${urls.length} buyers`);
  return urls.slice(0, maxBuyers);
}

/* ───── Parser les annonces d'une page acheteur ───── */
function parseBuyerPage(html: string, buyerName: string): KlekoonMarche[] {
  const results: KlekoonMarche[] = [];
  const $ = cheerio.load(html);

  // Each tender block: <div class="row no-gutters mb-3" id="{consultation_ID}">
  $('div.row.no-gutters.mb-3[id]').each((_, el) => {
    const block = $(el);
    const consultationId = block.attr('id');
    if (!consultationId || !/^\d+$/.test(consultationId)) return;

    const fullText = block.text();

    // Title: inside <b><u>...</u></b>
    const title = block.find('b u').first().text().trim();
    if (!title) return;

    // Emetteur: look for text with department code pattern "NOM (XX)"
    let emetteur = '';
    block.find('b').each((_, b) => {
      const t = $(b).text().trim();
      if (t.match(/\(\d{2,3}[AB]?\)\s*$/) && !t.includes(title)) {
        emetteur = t;
      }
    });
    if (!emetteur) emetteur = buyerName;

    const dept = extractDept(emetteur);
    const deptInfo = DEPT_MAP[dept];

    // Dates: look for DD/MM/YYYY patterns
    const dates = fullText.match(/\d{2}\/\d{2}\/\d{4}/g) || [];
    const publicationDate = dates.length > 0 ? parseFrDate(dates[0]!) : null;
    const deadline = dates.length > 1 ? parseFrDate(dates[1]!) : null;

    // Procedure type: look for "Procédure ..." or "Klekoon - ..."
    let procedureType: string | null = null;
    const procMatch = fullText.match(/(?:Klekoon\s*-\s*)?Procédure\s+(\w+)/i);
    if (procMatch) procedureType = `Procédure ${procMatch[1]}`;

    // Nature from full text
    const nature = mapNature(fullText);

    results.push({
      title: title.slice(0, 500),
      buyer: emetteur.replace(/\s*\(\d{2,3}[AB]?\)\s*$/, '').trim() || buyerName,
      nature,
      department: dept,
      departmentName: deptInfo?.name || null,
      region: deptInfo?.region || null,
      value: null,
      deadline,
      publicationDate,
      source: 'KLEKOON',
      sourceRef: `KLEKOON-${consultationId}`,
      procedureType,
      cpvCode: null,
      cpvLabel: null,
      lots: 1,
      duration: null,
      status: deadline && deadline < new Date() ? 'FERME' : 'OUVERT',
    });
  });

  return results;
}

/* ───── Scraper une page acheteur (avec pagination) ───── */
async function scrapeBuyer(
  buyerUrl: string,
  limit: number,
): Promise<KlekoonMarche[]> {
  const headers: Record<string, string> = {
    'User-Agent': UA,
    'Content-Type': 'application/x-www-form-urlencoded',
    Accept: 'text/html,application/xhtml+xml',
    Referer: `${BASE_URL}/`,
  };

  const allRecords: KlekoonMarche[] = [];
  const buyerName = decodeURIComponent(
    buyerUrl.split('/').pop()?.replace(/-\d+$/, '').replace(/-/g, ' ') || 'Acheteur'
  );

  // Page 0 (first page) — POST with page=0
  for (let page = 0; page < 10 && allRecords.length < limit; page++) {
    const body = `page=${page}`;
    const res = await fetchWithRetry(buyerUrl, {
      method: 'POST',
      headers,
      body,
    });

    if (!res) {
      if (page === 0) {
        // Try GET for first page
        const getRes = await fetchWithRetry(buyerUrl, { headers: { 'User-Agent': UA } });
        if (!getRes) break;
        const html = await getRes.text();
        const records = parseBuyerPage(html, buyerName);
        allRecords.push(...records);
      }
      break;
    }

    const html = await res.text();
    const records = parseBuyerPage(html, buyerName);

    if (records.length === 0) break;
    allRecords.push(...records);

    // Small delay between pages
    await new Promise((r) => setTimeout(r, 500));
  }

  return allRecords;
}

/* ───── Fonction principale ───── */
export async function fetchKlekoonRecords(options?: {
  limit?: number;
  maxBuyers?: number;
}): Promise<KlekoonMarche[]> {
  const limit = options?.limit ?? 5000;
  const maxBuyers = options?.maxBuyers ?? 50;
  const allRecords: KlekoonMarche[] = [];

  console.log(`[KLEKOON] Fetching annonces from klekoon.com (max ${maxBuyers} buyers, limit ${limit})...`);

  // Step 1: Get buyer URLs
  const buyerUrls = await fetchBuyerUrls(maxBuyers);
  if (buyerUrls.length === 0) return [];

  // Step 2: Scrape each buyer page
  for (const url of buyerUrls) {
    if (allRecords.length >= limit) break;

    const remaining = limit - allRecords.length;
    const records = await scrapeBuyer(url, remaining);
    allRecords.push(...records);

    console.log(`[KLEKOON] ${url.split('/').pop()}: ${records.length} annonces (total: ${allRecords.length})`);

    // Delay between buyers to be polite
    await new Promise((r) => setTimeout(r, 1000));
  }

  // Deduplicate by sourceRef
  const seen = new Set<string>();
  const unique = allRecords.filter((r) => {
    if (seen.has(r.sourceRef)) return false;
    seen.add(r.sourceRef);
    return true;
  });

  console.log(`[KLEKOON] Total unique records: ${unique.length}`);
  return unique.slice(0, limit);
}
