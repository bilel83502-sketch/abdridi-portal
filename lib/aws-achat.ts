/**
 * AWS-Achat (AW Solutions) — marches-publics.info
 * https://www.marches-publics.info
 *
 * Méthode : scraping HTML via POST sur /Annonces/lister
 * Le site refuse d'afficher les résultats si la recherche est trop large.
 * Stratégie : itérer par nature (T, S, F) × plage de date pour rester
 * sous le seuil d'affichage du serveur.
 * Chaque annonce est dans un div.container-fluid#entity.
 * Le lien de détail est de la forme /Annonces/MPI-pub-{id}.htm
 */

import * as cheerio from 'cheerio';
import { writeFileSync } from 'fs';

const BASE_URL = 'https://www.marches-publics.info';
const LIST_URL = `${BASE_URL}/Annonces/lister`;
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

/* ───── Nature codes sur le site ───── */
const NATURE_CODES: { code: string; label: string }[] = [
  { code: 'T', label: 'TRAVAUX' },
  { code: 'S', label: 'SERVICES' },
  { code: 'F', label: 'FOURNITURES' },
];

/* ───── Date filter values from the site's <select> ───── */
const DATE_PARUTION_FILTERS = [
  ' = 0',  // Aujourd'hui
  ' = 1',  // Hier
  ' < 2',  // 2 derniers jours
  ' < 8',  // 8 derniers jours
  ' < 30', // 30 derniers jours
];

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

/* ───── Parse une date DD/MM/YY ou DD/MM/YYYY ───── */
function parseDate(raw: string): Date | null {
  // DD/MM/YY or DD/MM/YYYY, optionally followed by " à HHhMM"
  const m = raw.match(/(\d{2})\/(\d{2})\/(\d{2,4})/);
  if (!m) return null;
  let year = parseInt(m[3]);
  if (year < 100) year += 2000;
  const d = new Date(`${year}-${m[2]}-${m[1]}T12:00:00+01:00`);
  return isNaN(d.getTime()) ? null : d;
}

/* ───── Extraire le nombre total de pages ───── */
function extractTotalPages(html: string): number {
  const $ = cheerio.load(html);
  let max = 1;
  $('nav a[href*="pager_t="]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const m = href.match(/pager_t=(\d+)/);
    if (m) {
      const p = parseInt(m[1]);
      if (p > max) max = p;
    }
  });
  return max;
}

/* ───── Parser le HTML des résultats avec cheerio ───── */
function parseResultsHtml(html: string, natureLabel: string): AwsAchatMarche[] {
  const results: AwsAchatMarche[] = [];

  // Check if server refused (too many results)
  if (html.includes('Veuillez préciser votre recherche')) return [];

  const $ = cheerio.load(html);

  // Each result is a div.container-fluid#entity
  $('div.container-fluid#entity').each((_, el) => {
    const entity = $(el);

    // Detail link: a[href*="MPI-pub-"]
    const detailLink = entity.find('a[href*="MPI-pub-"]').first();
    const href = detailLink.attr('href') || '';
    const refMatch = href.match(/MPI-pub-(\d+)\.htm/);
    if (!refMatch) return;
    const ref = refMatch[1];

    // Buyer + department from h2.h2-avis: "Buyer Name (75013)" or "Buyer (56009 )"
    const h2Text = entity.find('h2.h2-avis').text().trim();
    const buyerMatch = h2Text.match(/^(.+?)\s*\((\d{2,5})\s*\)\s*$/);
    const buyer = (buyerMatch ? buyerMatch[1] : h2Text).replace(/\s+/g, ' ').trim();
    const postalCode = buyerMatch ? buyerMatch[2].trim() : '';
    // Extract department from postal code (first 2 or 3 digits for DOM)
    let dept = '00';
    if (postalCode.startsWith('97') && postalCode.length >= 3) {
      dept = postalCode.slice(0, 3);
    } else if (postalCode.length >= 2) {
      dept = postalCode.slice(0, 2);
    }
    const deptInfo = DEPT_MAP[dept];

    // Title from #titre_box text content (after ref-acheteur div)
    const titreBox = entity.find('#titre_box');
    // Remove the ref-acheteur div to get clean title
    const refDiv = titreBox.find('.ref-acheteur').remove();
    const title = titreBox.text().replace(/\s+/g, ' ').trim();
    if (!title) return;

    // Dates from .affiche_date_avis
    const dateRow = entity.find('.affiche_date_avis');
    const dateText = dateRow.text();
    // "Publié le 17/03/26"
    const pubMatch = dateText.match(/Publi[ée]\s+le\s+(\d{2}\/\d{2}\/\d{2,4})/i);
    const publicationDate = pubMatch ? parseDate(pubMatch[1]) : null;
    // "Date limite : le 13/04/26 à 12h00"
    const deadlineMatch = dateText.match(/Date\s+limite\s*:\s*le\s+(\d{2}\/\d{2}\/\d{2,4})/i);
    const deadline = deadlineMatch ? parseDate(deadlineMatch[1]) : null;

    results.push({
      title: title.slice(0, 500),
      buyer: buyer.slice(0, 300) || 'AWS-Achat',
      nature: natureLabel,
      department: dept,
      departmentName: deptInfo?.name || null,
      region: deptInfo?.region || null,
      value: null,
      deadline,
      publicationDate,
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

/* ───── Gestion session (cookie) ───── */
let sessionCookie = '';

async function ensureSession(): Promise<void> {
  if (sessionCookie) return;
  const res = await fetchWithRetry(LIST_URL, {
    headers: { 'User-Agent': UA, Accept: 'text/html' },
  });
  if (!res) return;
  // Extract Set-Cookie header(s)
  const setCookies = res.headers.getSetCookie?.() ?? [];
  sessionCookie = setCookies
    .map((c) => c.split(';')[0])
    .join('; ');
  await res.text(); // consume body
}

/* ───── POST une recherche et parser les résultats (toutes pages) ───── */
async function fetchNatureDateSlice(
  natureCode: string,
  natureLabel: string,
  dateFilter: string,
  maxPages = 10,
): Promise<AwsAchatMarche[]> {
  await ensureSession();

  const formBody = new URLSearchParams({
    IDE: 'EC',
    IDN: natureCode,
    listeCPV: '',
    IDP: 'X',
    IDR: 'X',
    txtLibre: '',
    txtLibreLieuExec: '',
    dateNotifDebut: '',
    dateNotifFin: '',
    txtAcheteurNom: '',
    txtAcheteurSiret: '',
    txtTitulaireNom: '',
    txtTitulaireSiret: '',
    txtLibreAcheteur: '',
    txtLibreVille: '',
    txtLibreRef: '',
    txtLibreObjet: '',
    dateParution: dateFilter,
    dateExpiration: '',
    annee: 'X',
    Rechercher: 'Rechercher',
  }).toString();

  const headers: Record<string, string> = {
    'User-Agent': UA,
    'Content-Type': 'application/x-www-form-urlencoded',
    Accept: 'text/html,application/xhtml+xml',
    Referer: `${BASE_URL}/Annonces/lister`,
    ...(sessionCookie ? { Cookie: sessionCookie } : {}),
  };

  // Page 1: POST
  const res = await fetchWithRetry(LIST_URL, {
    method: 'POST',
    headers,
    body: formBody,
  });

  if (!res) return [];
  const setCookies = res.headers.getSetCookie?.() ?? [];
  if (setCookies.length) {
    sessionCookie = setCookies.map((c) => c.split(';')[0]).join('; ');
  }
  const html = await res.text();

  // Debug: save first response to /tmp for inspection
  try { writeFileSync('/tmp/aws-debug.html', html); } catch { /* ignore */ }

  const allRecords = parseResultsHtml(html, natureLabel);
  const totalPages = Math.min(extractTotalPages(html), maxPages);

  // Pages 2..N: GET with pager_t
  for (let page = 2; page <= totalPages; page++) {
    await new Promise((r) => setTimeout(r, 600));
    const pageRes = await fetchWithRetry(`${LIST_URL}?pager_t=${page}`, {
      headers: {
        'User-Agent': UA,
        Accept: 'text/html,application/xhtml+xml',
        Referer: LIST_URL,
        ...(sessionCookie ? { Cookie: sessionCookie } : {}),
      },
    });
    if (!pageRes) break;
    const pageHtml = await pageRes.text();
    const pageRecords = parseResultsHtml(pageHtml, natureLabel);
    if (pageRecords.length === 0) break;
    allRecords.push(...pageRecords);
  }

  return allRecords;
}

/* ───── Fonction principale ───── */
export async function fetchAwsAchatRecords(options?: {
  limit?: number;
  dateFilter?: string;
}): Promise<AwsAchatMarche[]> {
  const limit = options?.limit ?? 2000;
  const dateFilter = options?.dateFilter ?? ' = 0'; // Default: today
  const allRecords: AwsAchatMarche[] = [];

  console.log(`[AWS] Fetching annonces from marches-publics.info (dateFilter: "${dateFilter.trim()}")...`);

  // Iterate by nature to stay under the server's result display threshold
  for (const { code, label } of NATURE_CODES) {
    if (allRecords.length >= limit) break;
    await new Promise((r) => setTimeout(r, 800));

    const records = await fetchNatureDateSlice(code, label, dateFilter);
    allRecords.push(...records);
    console.log(`[AWS] Nature ${label}: ${records.length} items (total: ${allRecords.length})`);

    // If a single nature still returns 0 (server refused), try splitting further
    // by iterating individual date filters
    if (records.length === 0 && dateFilter !== ' = 0') {
      console.log(`[AWS] Nature ${label} returned 0 with "${dateFilter.trim()}", trying today only...`);
      await new Promise((r) => setTimeout(r, 800));
      const fallback = await fetchNatureDateSlice(code, label, ' = 0');
      allRecords.push(...fallback);
      console.log(`[AWS] Nature ${label} (today fallback): ${fallback.length} items`);
    }
  }

  // Deduplicate by sourceRef
  const seen = new Set<string>();
  const unique = allRecords.filter((r) => {
    if (seen.has(r.sourceRef)) return false;
    seen.add(r.sourceRef);
    return true;
  });

  console.log(`[AWS] Total unique records: ${unique.length}`);
  return unique.slice(0, limit);
}
