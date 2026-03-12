/**
 * PLACE — Plateforme des Achats de l'État (marches-publics.gouv.fr)
 * Plateforme officielle de l'État pour les marchés publics (ministères, EPA, CDC, UGAP…)
 *
 * Méthode : scraping de la page publique de recherche AllCons avec pagination
 * via le framework Prado (GET initial + POST pour les pages suivantes).
 */

const BASE_URL = 'https://www.marches-publics.gouv.fr';
const SEARCH_URL = `${BASE_URL}/?page=Entreprise.EntrepriseAdvancedSearch&searchAnnCons&AllCons`;
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
  '21': { name: 'Côte-d\'Or', region: 'Bourgogne-Franche-Comté' },
  '22': { name: 'Côtes-d\'Armor', region: 'Bretagne' },
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
  '95': { name: 'Val-d\'Oise', region: 'Île-de-France' },
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

/* ───── Mois français → numéro ───── */
const MONTH_MAP: Record<string, string> = {
  'janv': '01', 'jan': '01', 'janvier': '01',
  'fév': '02', 'fevr': '02', 'février': '02', 'fev': '02',
  'mars': '03', 'mar': '03',
  'avr': '04', 'avril': '04',
  'mai': '05',
  'juin': '06', 'jun': '06',
  'juil': '07', 'juillet': '07', 'jul': '07',
  'août': '08', 'aout': '08', 'aoû': '08',
  'sept': '09', 'sep': '09', 'septembre': '09',
  'oct': '10', 'octobre': '10',
  'nov': '11', 'novembre': '11',
  'déc': '12', 'dec': '12', 'décembre': '12',
};

function parseFrenchMonth(raw: string): string {
  const clean = raw.toLowerCase().replace(/\./g, '').trim();
  return MONTH_MAP[clean] || '01';
}

/* ───── Extraire département depuis "(XX) Nom" ───── */
function extractDepartment(text: string): string {
  const match = text.match(/\((\d{2,3}|2[AB])\)/);
  return match ? match[1] : '00';
}

/* ───── Décoder les entités HTML ───── */
function decodeHtml(html: string): string {
  return html
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)))
    .replace(/<[^>]+>/g, '')
    .trim();
}

/* ───── Type retour ───── */
export interface PlaceMarche {
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

/* ───── Parser les consultations depuis le HTML ───── */
function parseResultsHtml(html: string): PlaceMarche[] {
  const results: PlaceMarche[] = [];
  const items = html.split('class="item_consultation');

  for (let i = 1; i < items.length; i++) {
    const item = items[i];

    // refCons = unique consultation ID
    const refConsMatch = item.match(/refCons"[^>]*value="([^"]+)"/);
    const refCons = refConsMatch?.[1];
    if (!refCons) continue;

    // orgAcronyme
    const orgMatch = item.match(/orgCons"[^>]*value="([^"]+)"/);
    const orgAcronyme = orgMatch?.[1] || '';

    // Procedure type (abbr or span in cons_procedure)
    const procMatch = item.match(/cons_procedure[\s\S]*?<span>([^<]+)<\/span>/);
    const procedureType = procMatch ? procMatch[1].trim() : null;

    // Nature (in cons_categorie)
    const natureMatch = item.match(/cons_categorie[\s\S]*?<span>([^<]+)<\/span>/);
    const nature = natureMatch ? mapNature(natureMatch[1]) : 'SERVICES';

    // Publication date (day/month/year structure)
    const dayMatch = item.match(/class="day">[\s\S]*?<span>(\d+)<\/span>/);
    const monthMatch = item.match(/class="month">[\s\S]*?<span>([^<]+)<\/span>/);
    const yearMatch = item.match(/class="year">[\s\S]*?<span>(\d+)<\/span>/);
    let publicationDate: Date | null = null;
    if (dayMatch && monthMatch && yearMatch) {
      const mm = parseFrenchMonth(monthMatch[1]);
      const dd = dayMatch[1].padStart(2, '0');
      publicationDate = new Date(`${yearMatch[1]}-${mm}-${dd}T00:00:00+01:00`);
    }

    // Reference code + Title (in the m-b-1 clearfix section)
    const refCodeMatch = item.match(/small pull-left">\s*([\w\-/]+)/);
    const refCode = refCodeMatch ? refCodeMatch[1].trim() : '';

    const titleMatch = item.match(/small pull-left truncate[\s\S]*?title="([^"]*)"/);
    const title = titleMatch ? decodeHtml(titleMatch[1]) : '';

    // Object/description
    const objMatch = item.match(/truncate-700[\s\S]*?title="([^"]*)"/);
    const description = objMatch ? decodeHtml(objMatch[1]) : '';

    // Department: "(XX) Nom"
    const deptMatch = item.match(/\((\d{2,3}|2[AB])\)\s*([^<,]+)/);
    const dept = deptMatch ? deptMatch[1] : '00';
    const deptInfo = DEPT_MAP[dept];

    // Lots count
    const lotsMatch = item.match(/(\d+)\s*(?:&nbsp;)?lots?/i);
    const lots = lotsMatch ? parseInt(lotsMatch[1]) : 1;

    // Deadline (cloture-line section)
    let deadline: Date | null = null;
    const clotureIdx = item.indexOf('cloture-line');
    if (clotureIdx > 0) {
      const clotureSection = item.substring(clotureIdx, clotureIdx + 500);
      const clotDay = clotureSection.match(/class="day[\s"]*>[\s\S]*?<span>(\d+)<\/span>/);
      const clotMonth = clotureSection.match(/class="month">[\s\S]*?<span>([^<]+)<\/span>/);
      const clotYear = clotureSection.match(/class="year">[\s\S]*?<span>(\d+)<\/span>/);
      const clotTime = clotureSection.match(/<label[^>]*>(\d{1,2}:\d{2})/);

      if (clotDay && clotMonth && clotYear) {
        const mm = parseFrenchMonth(clotMonth[1]);
        const dd = clotDay[1].padStart(2, '0');
        const hh = clotTime ? clotTime[1] : '12:00';
        deadline = new Date(`${clotYear[1]}-${mm}-${dd}T${hh}:00+01:00`);
      }
    }

    // Buyer: the organisme field is not directly in the listing.
    // Use the "secteur" span or fallback to "PLACE - État"
    const sectorMatch = item.match(/cons_categorie[\s\S]*?<\/div>[\s\S]*?<span[^>]*>([^<]+)<\/span>/);
    const buyer = sectorMatch ? decodeHtml(sectorMatch[1]) : 'État (PLACE)';

    // Build the display title
    const fullTitle = refCode && title ? `${refCode} — ${title}` : title || description || refCode;

    if (!fullTitle) continue;

    results.push({
      title: fullTitle.slice(0, 500),
      buyer: buyer.slice(0, 300),
      nature,
      department: dept,
      departmentName: deptInfo?.name || null,
      region: deptInfo?.region || null,
      value: null,
      deadline,
      publicationDate,
      source: 'PLACE',
      sourceRef: `PLACE-${refCons}`,
      procedureType,
      cpvCode: null,
      cpvLabel: null,
      lots,
      duration: null,
      status: 'OUVERT',
    });
  }

  return results;
}

/* ───── Helpers pour la session Prado ───── */
function extractCsrf(html: string): string {
  const m = html.match(/name="_csrf_token"\s+value="([^"]*)"/);
  return m?.[1] || '';
}

function extractPageState(html: string): string {
  const m = html.match(/PRADO_PAGESTATE[^v]*value="([^"]*)"/);
  return m?.[1] || '';
}

function extractTotalPages(html: string): number {
  const m = html.match(/nombrePageTop">(\d+)/);
  return m ? parseInt(m[1]) : 1;
}

/* ───── Fetch avec retry ───── */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3,
): Promise<Response> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;
      if (attempt === maxRetries) {
        throw new Error(`HTTP ${res.status} after ${maxRetries} attempts`);
      }
    } catch (e) {
      if (attempt === maxRetries) throw e;
    }
    // Wait before retry (exponential backoff)
    await new Promise((r) => setTimeout(r, 1000 * attempt));
  }
  throw new Error('Unreachable');
}

/* ───── Fonction principale ───── */
export async function fetchPlaceRecords(options?: {
  limit?: number;
}): Promise<PlaceMarche[]> {
  const limit = options?.limit ?? 200;

  console.log(`[PLACE] Getting initial page...`);

  // Step 1: GET initial page to establish session and get PAGESTATE
  const initRes = await fetchWithRetry(SEARCH_URL, {
    headers: {
      'User-Agent': UA,
      Accept: 'text/html,application/xhtml+xml',
    },
  });

  // Extract cookies from Set-Cookie headers
  const setCookies = initRes.headers.getSetCookie?.() || [];
  const cookies = setCookies.map((c) => c.split(';')[0]).join('; ');

  let html = await initRes.text();
  let totalPages = extractTotalPages(html);
  let records = parseResultsHtml(html);

  console.log(`[PLACE] Page 1: ${records.length} items, ${totalPages} pages total`);

  const allRecords: PlaceMarche[] = [...records];
  const maxPages = Math.min(Math.ceil(limit / PAGE_SIZE), totalPages);

  // Step 2: POST for subsequent pages
  for (let page = 2; page <= maxPages && allRecords.length < limit; page++) {
    // Respect the server - wait between requests
    await new Promise((r) => setTimeout(r, 1500));

    const csrf = extractCsrf(html);
    const pageState = extractPageState(html);

    if (!pageState) {
      console.log(`[PLACE] No PAGESTATE found, stopping at page ${page - 1}`);
      break;
    }

    console.log(`[PLACE] Fetching page ${page}/${maxPages}...`);

    const body = new URLSearchParams({
      _csrf_token: csrf,
      PRADO_PAGESTATE: pageState,
      'ctl0$CONTENU_PAGE$resultSearch$numPageTop': page.toString(),
      'ctl0$CONTENU_PAGE$resultSearch$DefaultButtonTop': '',
      'ctl0$CONTENU_PAGE$resultSearch$listePageSizeTop': PAGE_SIZE.toString(),
      'ctl0$atexoUtah$javaVersion': '',
    });

    try {
      const res = await fetchWithRetry(SEARCH_URL, {
        method: 'POST',
        headers: {
          'User-Agent': UA,
          Accept: 'text/html',
          'Content-Type': 'application/x-www-form-urlencoded',
          Referer: SEARCH_URL,
          Cookie: cookies,
        },
        body: body.toString(),
      });

      html = await res.text();
      records = parseResultsHtml(html);

      if (records.length === 0) {
        console.log(`[PLACE] No results on page ${page}, stopping`);
        break;
      }

      allRecords.push(...records);
      console.log(`[PLACE] Page ${page}: ${records.length} items (total: ${allRecords.length})`);
    } catch (e: any) {
      console.error(`[PLACE] Error on page ${page}: ${e.message}`);
      break;
    }
  }

  // Deduplicate by sourceRef
  const seen = new Set<string>();
  const unique = allRecords.filter((r) => {
    if (seen.has(r.sourceRef)) return false;
    seen.add(r.sourceRef);
    return true;
  });

  console.log(`[PLACE] Total records mapped: ${unique.length}`);
  return unique.slice(0, limit);
}
