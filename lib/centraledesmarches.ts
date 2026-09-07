/**
 * Centrale des Marchés (centraledesmarches.com) — Agrégateur national
 * https://centraledesmarches.com
 *
 * Éditeur : Medialex SAS (groupe SIPA / Ouest-France). Lancé en 2021,
 * cousin de francemarches.com. Agrège BOAMP, JOUE/TED, DECP, profils
 * acheteurs et JAL/PQR. ≈ 17 500 AO en ligne, dont ≈ 1 062 transport
 * (CPV 60 + 34 + 50.1 + 63 cumulés).
 *
 * Méthode : scraping HTML public via cheerio. Pas d'API documentée.
 * Le site accepte des query params bien lisibles (cf. URL pivot fournie
 * par Bilel) — c'est le bon signe pour scraper.
 *
 * URL pivot transport :
 *   https://centraledesmarches.com/marches-publics
 *     ?keywords=transport&keywordsOperator=AND&status=2
 *
 * status=2 → AO ouverts (status=0/1 → autres états ; à confirmer par
 * inspection si on veut récupérer aussi les avis d'attribution).
 *
 * IMPORTANT — TODO PARSING :
 * Les sélecteurs CSS marqués TODO doivent être confirmés en exécutant :
 *   npx tsx scripts/sync-centraledesmarches.ts --debug --limit=10
 * Le script affichera la page brute si parseListingHtml ne trouve rien,
 * permettant d'ajuster les sélecteurs. Tant que non confirmés, la fonction
 * retournera 0 résultat sans casser le build (fail-soft).
 *
 * Anti-bot : Medialex sert un challenge Cloudflare ponctuel. User-Agent
 * honnête + Accept-Language fr-FR + délai ≥ 1,5 s entre requêtes
 * suffisent en général. Si blocage, envisager :
 *   1. Rotation user-agents
 *   2. Headers Accept / Referer cohérents
 *   3. Proxy résidentiel français (hors scope Sprint 1)
 *
 * Cadre juridique :
 *   - Les données AO sont publiques par nature (Code commande publique).
 *   - Medialex n'a pas de monopole sur la rediffusion.
 *   - On scrape uniquement les listes + métadonnées, jamais le contenu
 *     éditorial (analyses, commentaires).
 *   - Rate-limit respectueux (1 req / 2 s) pour ne pas peser sur leur infra.
 *   - User-Agent identifiable ("AB DRIDI Portal — contact@abdridi.com").
 */

import * as cheerio from 'cheerio';

const BASE_URL = 'https://centraledesmarches.com';
const LIST_PATH = '/marches-publics';
const PAGE_SIZE = 20; // à confirmer par inspection
const UA =
  'Mozilla/5.0 (compatible; AB-DRIDI-Portal/1.0; +https://portal.abdridi.com; contact@abdridi.com) Chrome/122.0.0.0';
const REQUEST_DELAY_MS = 1500;

/* ───── Mapping département → nom + région (réutilisable, identique aux autres scrapers) ───── */
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
  '2A': { name: 'Corse-du-Sud', region: 'Corse' },
  '2B': { name: 'Haute-Corse', region: 'Corse' },
  '21': { name: 'Côte-d\'Or', region: 'Bourgogne-Franche-Comté' },
  '22': { name: 'Côtes-d\'Armor', region: 'Bretagne' },
  '23': { name: 'Creuse', region: 'Nouvelle-Aquitaine' },
  '24': { name: 'Dordogne', region: 'Nouvelle-Aquitaine' },
  '25': { name: 'Doubs', region: 'Bourgogne-Franche-Comté' },
  '26': { name: 'Drôme', region: 'Auvergne-Rhône-Alpes' },
  '27': { name: 'Eure', region: 'Normandie' },
  '28': { name: 'Eure-et-Loir', region: 'Centre-Val de Loire' },
  '29': { name: 'Finistère', region: 'Bretagne' },
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
  '95': { name: 'Val-d\'Oise', region: 'Île-de-France' },
};

function inferDepartmentFromZip(zip: string | null | undefined): string {
  if (!zip) return '';
  const z = zip.trim();
  if (z.startsWith('20')) {
    const n = parseInt(z, 10);
    if (n >= 20000 && n <= 20190) return '2A';
    if (n >= 20200 && n <= 20620) return '2B';
  }
  return z.length >= 2 ? z.substring(0, 2) : '';
}

function parseFrenchDate(raw: string | undefined | null): Date | null {
  if (!raw) return null;
  const s = raw.trim();
  // formats acceptés : "26/06/2026", "26/06/2026 12:00", "26 juin 2026"
  const dmy = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (dmy) {
    const [, d, m, y, hh, mm] = dmy;
    const dt = new Date(
      `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T${(hh || '12').padStart(2, '0')}:${(mm || '00').padStart(2, '0')}:00+02:00`,
    );
    return isNaN(dt.getTime()) ? null : dt;
  }
  const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  const txt = s.match(/(\d{1,2})\s+([a-zéû]+)\s+(\d{4})/i);
  if (txt) {
    const idx = months.findIndex((m) => m === txt[2].toLowerCase());
    if (idx >= 0) {
      const dt = new Date(`${txt[3]}-${(idx + 1).toString().padStart(2, '0')}-${txt[1].padStart(2, '0')}T12:00:00+02:00`);
      return isNaN(dt.getTime()) ? null : dt;
    }
  }
  return null;
}

/* ───── Types retour ───── */
export interface CdmListItem {
  sourceRef: string;           // hash stable basé sur l'URL détail
  title: string;
  buyer: string;
  zipCode: string;
  department: string;
  departmentName: string;
  region: string;
  publicationDate: Date | null;
  deadline: Date | null;
  detailUrl: string;
  cpvCode: string | null;
  cpvLabel: string | null;
  nature: string;              // 'SERVICE' / 'TRAVAUX' / 'FOURNITURES' (déduit)
}

export interface CdmFilters {
  keywords?: string;
  status?: number;             // 2 = ouverts
  maxPages?: number;
  pageDelayMs?: number;
}

/* ───── Helpers ───── */
async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildListUrl(filters: CdmFilters, page = 1): string {
  const params = new URLSearchParams({
    keywords: filters.keywords || '',
    keywordsOperator: 'AND',
    location: '',
    georange: '20',
    publicationType: '0',
    publicationDateStart: '',
    publicationDateEnd: '',
    clotureType: '0',
    clotureDateStart: '',
    clotureDateEnd: '',
    nomAcheteur: '',
    status: String(filters.status ?? 2),
  });
  if (page > 1) params.set('page', String(page));
  return `${BASE_URL}${LIST_PATH}?${params.toString()}`;
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': UA,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.5',
    },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`CDM fetch failed ${res.status} on ${url}`);
  return await res.text();
}

/* ───── Parseur listing ───── */
function parseListingHtml(html: string): CdmListItem[] {
  const $ = cheerio.load(html);
  const items: CdmListItem[] = [];

  // TODO PARSING — sélecteurs à confirmer par inspection manuelle.
  // Le site Medialex/CDM utilise probablement une structure type
  // <article class="annonce"> ou <div class="market-item">. Les
  // sélecteurs ci-dessous sont des PLACEHOLDERS optimistes.
  // À valider avec : npx tsx scripts/sync-centraledesmarches.ts --debug --limit=5
  const cards = $('article.annonce, div.market-item, .av-card, li.av').toArray();

  for (const el of cards) {
    const $el = $(el);
    const titleLink = $el.find('a.titre, h2 a, .av-titre a').first();
    const title = titleLink.text().trim();
    const href = titleLink.attr('href') || '';
    if (!title || !href) continue;
    const detailUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;

    const buyer = $el.find('.acheteur, .av-acheteur, .buyer-name').first().text().trim();
    const zipText = $el.find('.localisation, .zip, .av-cp').first().text().trim();
    const zip = (zipText.match(/\b(\d{5})\b/) || [])[1] || '';
    const dept = inferDepartmentFromZip(zip);
    const deptInfo = DEPT_MAP[dept] || { name: '', region: '' };

    const pubText = $el.find('.date-publication, .av-pub').first().text().trim();
    const clotText = $el.find('.date-cloture, .deadline, .av-cloture').first().text().trim();

    const cpvText = $el.find('.cpv, .av-cpv').first().text().trim();
    const cpvMatch = cpvText.match(/(\d{8})/);
    const cpvCode = cpvMatch ? cpvMatch[1] : null;

    // Sentinelle nature — par défaut SERVICES (transport = CPV 60.x)
    const nature = /travaux/i.test(cpvText) ? 'TRAVAUX'
                 : /fourniture/i.test(cpvText) ? 'FOURNITURES'
                 : 'SERVICES';

    items.push({
      sourceRef: `cdm_${detailUrl.replace(/[^a-z0-9]/gi, '').slice(-40)}`,
      title,
      buyer,
      zipCode: zip,
      department: dept,
      departmentName: deptInfo.name,
      region: deptInfo.region,
      publicationDate: parseFrenchDate(pubText),
      deadline: parseFrenchDate(clotText),
      detailUrl,
      cpvCode,
      cpvLabel: cpvText || null,
      nature,
    });
  }

  return items;
}

/* ───── Main entry point ───── */
export async function fetchCentraleDesMarchesRecords(
  filters: CdmFilters = {},
): Promise<CdmListItem[]> {
  const maxPages = filters.maxPages ?? 50; // 1 000 AO max par run par défaut
  const all: CdmListItem[] = [];

  for (let page = 1; page <= maxPages; page++) {
    const url = buildListUrl(filters, page);
    let html: string;
    try {
      html = await fetchHtml(url);
    } catch (e) {
      console.warn(`[CDM] page ${page} fetch error:`, (e as Error).message);
      break;
    }
    const records = parseListingHtml(html);
    if (records.length === 0) break;
    all.push(...records);
    await sleep(filters.pageDelayMs ?? REQUEST_DELAY_MS);
  }
  return all;
}

/* Export debug pour script CLI : renvoie le HTML brut d'une page */
export async function fetchCentraleDesMarchesRawPage(
  filters: CdmFilters = {},
  page = 1,
): Promise<string> {
  const url = buildListUrl(filters, page);
  return await fetchHtml(url);
}
