/**
 * Synapse — Plateforme de marchés publics
 * https://www.synapse-entreprises.fr
 *
 * Méthode : Scraping HTML avec Cheerio
 * TODO: Vérifier la vraie structure HTML et les URLs d'appels d'offres
 */

import * as cheerio from 'cheerio';

const BASE_URL = 'https://www.synapse-entreprises.fr';
// TODO: Vérifier la vraie URL — peut être /consultations, /marches-publics, etc.
const SEARCH_URL = `${BASE_URL}/appels-offres`;
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

/* ───── Mapping département → nom + région ───── */
const DEPT_MAP: Record<string, { name: string; region: string }> = {
  '22': { name: "Côtes-d'Armor", region: 'Bretagne' },
  '29': { name: 'Finistère', region: 'Bretagne' },
  '35': { name: 'Ille-et-Vilaine', region: 'Bretagne' },
  '56': { name: 'Morbihan', region: 'Bretagne' },
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
  '23': { name: 'Creuse', region: 'Nouvelle-Aquitaine' },
  '24': { name: 'Dordogne', region: 'Nouvelle-Aquitaine' },
  '25': { name: 'Doubs', region: 'Bourgogne-Franche-Comté' },
  '26': { name: 'Drôme', region: 'Auvergne-Rhône-Alpes' },
  '27': { name: 'Eure', region: 'Normandie' },
  '28': { name: 'Eure-et-Loir', region: 'Centre-Val de Loire' },
  '2A': { name: 'Corse-du-Sud', region: 'Corse' },
  '2B': { name: 'Haute-Corse', region: 'Corse' },
  '30': { name: 'Gard', region: 'Occitanie' },
  '31': { name: 'Haute-Garonne', region: 'Occitanie' },
  '32': { name: 'Gers', region: 'Occitanie' },
  '33': { name: 'Gironde', region: 'Nouvelle-Aquitaine' },
  '34': { name: 'Hérault', region: 'Occitanie' },
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
export interface SynapseMarche {
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

/* ───── Simple hash from title+buyer for sourceRef ───── */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash).toString(36);
}

/* ───── Extract department code from a location string ───── */
// TODO: Adapter l'extraction du département selon le format réel affiché sur Synapse
function extractDept(location: string): string | null {
  // Try to match a postal code (5 digits) and extract dept
  const postalMatch = location.match(/\b(\d{5})\b/);
  if (postalMatch) {
    const code = postalMatch[1];
    const dept = code.startsWith('97') ? code.slice(0, 3) : code.slice(0, 2);
    if (DEPT_MAP[dept]) return dept;
  }
  // Try to match a raw dept code (2-3 digits)
  const deptMatch = location.match(/\b(\d{2,3})\b/);
  if (deptMatch && DEPT_MAP[deptMatch[1]]) return deptMatch[1];
  // Try Corse
  const corseMatch = location.match(/\b(2[AB])\b/i);
  if (corseMatch) return corseMatch[1].toUpperCase();
  return null;
}

/* ───── Parse a date string in common French formats ───── */
// TODO: Adapter le parsing de date selon le format réel affiché sur Synapse
function parseFrenchDate(raw: string): Date | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  // dd/mm/yyyy
  const frMatch = trimmed.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (frMatch) {
    const d = new Date(`${frMatch[3]}-${frMatch[2].padStart(2, '0')}-${frMatch[1].padStart(2, '0')}T23:59:59Z`);
    return isNaN(d.getTime()) ? null : d;
  }
  // yyyy-mm-dd (ISO)
  const isoMatch = trimmed.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const d = new Date(`${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}T23:59:59Z`);
    return isNaN(d.getTime()) ? null : d;
  }
  // Fallback
  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? null : d;
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
      if (res.status === 500 && attempt === maxRetries) return null;
    } catch (e) {
      if (attempt === maxRetries) return null;
    }
    await new Promise((r) => setTimeout(r, 1000 * attempt));
  }
  return null;
}

/* ───── Parse une page HTML et extraire les consultations ───── */
// TODO: Vérifier les sélecteurs CSS réels sur synapse-entreprises.fr
// Les sélecteurs ci-dessous sont des hypothèses basées sur des structures courantes
function parsePage($: cheerio.CheerioAPI): SynapseMarche[] {
  const records: SynapseMarche[] = [];

  // TODO: Adapter les sélecteurs selon la vraie structure HTML
  // Stratégie 1 : éléments avec classe .consultation-item ou .result-item
  // Stratégie 2 : lignes de tableau <tr>
  // Stratégie 3 : éléments <article> ou <div> avec data-attributes
  const selectors = [
    '.consultation-item',
    '.result-item',
    '.annonce-item',
    '.marche-item',
    'table.results tbody tr',
    'article.consultation',
    '.list-group-item',
    '.search-result',
  ];

  let $items: cheerio.Cheerio<any> | null = null;

  for (const selector of selectors) {
    const found = $(selector);
    if (found.length > 0) {
      $items = found;
      console.log(`[SYNAPSE] Matched selector: "${selector}" (${found.length} items)`);
      break;
    }
  }

  if (!$items || $items.length === 0) {
    console.warn('[SYNAPSE] No items found with known selectors');
    return records;
  }

  $items.each((_i, el) => {
    const $el = $(el);

    // TODO: Adapter l'extraction selon la vraie structure HTML
    // Essayer plusieurs sélecteurs courants pour chaque champ
    const title = (
      $el.find('h2 a, h3 a, .title a, .consultation-title, .annonce-title, td:nth-child(2)').first().text() ||
      $el.find('a').first().text() ||
      ''
    ).trim();

    if (!title) return;

    const buyer = (
      $el.find('.buyer, .organisme, .acheteur, .entity-name, td:nth-child(3)').first().text() ||
      ''
    ).trim();

    const locationText = (
      $el.find('.location, .lieu, .department, .localisation, td:nth-child(4)').first().text() ||
      ''
    ).trim();

    const deadlineText = (
      $el.find('.deadline, .date-limite, .date-cloture, .closing-date, td:last-child').first().text() ||
      ''
    ).trim();

    const natureText = (
      $el.find('.nature, .type, .category, .nature-prestation').first().text() ||
      ''
    ).trim();

    // Extract department
    const dept = extractDept(locationText) || extractDept(buyer) || '75';
    const deptInfo = DEPT_MAP[dept];

    // Parse deadline
    const deadline = parseFrenchDate(deadlineText);

    // Build sourceRef from hash of title + buyer
    const hash = simpleHash(`${title}${buyer}`);

    records.push({
      title: title.slice(0, 500),
      buyer: (buyer || 'Synapse Entreprises').slice(0, 300),
      nature: mapNature(natureText),
      department: dept,
      departmentName: deptInfo?.name || null,
      region: deptInfo?.region || null,
      value: null,
      deadline,
      publicationDate: new Date(),
      source: 'SYNAPSE',
      sourceRef: `SYNAPSE-${hash}`,
      procedureType: null,
      cpvCode: null,
      cpvLabel: null,
      lots: 1,
      duration: null,
      status: 'OUVERT',
    });
  });

  return records;
}

/* ───── Fonction principale ───── */
export async function fetchSynapseRecords(options?: {
  limit?: number;
}): Promise<SynapseMarche[]> {
  const limit = options?.limit ?? 200;
  const allRecords: SynapseMarche[] = [];
  let consecutiveErrors = 0;
  // TODO: Vérifier le nombre max de pages et le paramètre de pagination réel
  const maxPages = 20;

  console.log(`[SYNAPSE] Fetching up to ${limit} records via HTML scraping...`);

  for (let page = 1; page <= maxPages && allRecords.length < limit; page++) {
    if (page > 1) {
      await new Promise((r) => setTimeout(r, 2000));
    }

    // TODO: Vérifier le paramètre de pagination réel (?page=, ?p=, ?offset=, etc.)
    const url = page === 1 ? SEARCH_URL : `${SEARCH_URL}?page=${page}`;

    console.log(`[SYNAPSE] Fetching page ${page}: ${url}`);

    const res = await fetchWithRetry(url, {
      headers: {
        'User-Agent': UA,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.5',
      },
    });

    if (!res) {
      console.warn(`[SYNAPSE] Page ${page} failed, skipping`);
      consecutiveErrors++;
      if (consecutiveErrors >= 3) {
        console.log('[SYNAPSE] Too many consecutive errors, stopping');
        break;
      }
      continue;
    }

    consecutiveErrors = 0;

    const html = await res.text();
    const $ = cheerio.load(html);
    const pageRecords = parsePage($);

    if (pageRecords.length === 0) {
      console.log(`[SYNAPSE] No results on page ${page}, stopping pagination`);
      break;
    }

    allRecords.push(...pageRecords);
    console.log(`[SYNAPSE] Page ${page}: ${pageRecords.length} items (total: ${allRecords.length})`);
  }

  // Deduplicate by sourceRef
  const seen = new Set<string>();
  const unique = allRecords.filter((r) => {
    if (seen.has(r.sourceRef)) return false;
    seen.add(r.sourceRef);
    return true;
  });

  console.log(`[SYNAPSE] Total records mapped: ${unique.length}`);
  return unique.slice(0, limit);
}
