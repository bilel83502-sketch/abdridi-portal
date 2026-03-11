/**
 * e-marchespublics.com (Dematis) — Récupère les appels d'offres via l'API de recherche
 * Plus gros profil d'acheteur privé de France (5500+ collectivités)
 *
 * Méthode : scraping de la page publique /appel-offre puis appel à l'API
 * interne /notices/search/update pour paginer les résultats.
 */

const BASE_URL = 'https://www.e-marchespublics.com';
const SEARCH_URL = `${BASE_URL}/notices/search/update`;
const PAGE_URL = `${BASE_URL}/appel-offre`;
const PER_PAGE = 10; // max supporté par le site

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

/* ───── Mapping nature depuis le champ type ───── */
function mapNature(raw: string): string {
  const t = raw.toUpperCase();
  if (t.includes('TRAVAUX')) return 'TRAVAUX';
  if (t.includes('FOURNITURE')) return 'FOURNITURES';
  if (t.includes('SERVICE')) return 'SERVICES';
  return 'SERVICES';
}

/* ───── Extraction département depuis un code postal ───── */
function extractDepartment(location: string): string {
  const postalMatch = location.match(/\b((?:0[1-9]|[1-8]\d|9[0-5]|97[1-6]|2[AB])\d{3})\b/);
  if (postalMatch) {
    const code = postalMatch[1];
    if (code.startsWith('20')) {
      const num = parseInt(code.substring(0, 5));
      return num >= 20200 ? '2B' : '2A';
    }
    if (code.startsWith('97')) return code.substring(0, 3);
    return code.substring(0, 2);
  }
  return '00';
}

/* ───── Parse deadline "31/03/2026 à 10h00" ───── */
function parseDeadline(raw: string): Date | null {
  const match = raw.match(/(\d{2})\/(\d{2})\/(\d{4})\s*(?:à|a)?\s*(\d{1,2})h(\d{2})?/);
  if (match) {
    const [, day, month, year, hours, minutes] = match;
    const d = new Date(`${year}-${month}-${day}T${hours.padStart(2, '0')}:${minutes || '00'}:00+01:00`);
    if (!isNaN(d.getTime())) return d;
  }
  // Fallback: just a date
  const dateMatch = raw.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (dateMatch) {
    const [, day, month, year] = dateMatch;
    const d = new Date(`${year}-${month}-${day}T12:00:00+01:00`);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
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
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)));
}

/* ───── Type retour ───── */
export interface EMarchesPublicsMarche {
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

/* ───── Parser les résultats HTML en objets ───── */
function parseResultsHtml(html: string): EMarchesPublicsMarche[] {
  const results: EMarchesPublicsMarche[] = [];

  // Split by result boxes
  const boxes = html.split('<div class="box">');

  for (let i = 1; i < boxes.length; i++) {
    const box = boxes[i];

    // Title: inside <div class="texttruncate noselect">
    const titleMatch = box.match(/<div class="texttruncate[^"]*"[^>]*>\s*([\s\S]*?)\s*<\/div>/);
    const title = titleMatch ? decodeHtml(titleMatch[1].trim()) : null;
    if (!title) continue;

    // Buyer: inside <div class="box-body-top"> > <span>
    const buyerMatch = box.match(/<div class="box-body-top">\s*<span>([\s\S]*?)<\/span>/);
    const buyer = buyerMatch ? decodeHtml(buyerMatch[1].trim()) : 'Non précisé';

    // Location (postal code + city): after fa-map-marker-alt icon
    const locationMatch = box.match(/fa-map-marker-alt"><\/i>([\s\S]*?)<\/p>/);
    const location = locationMatch ? locationMatch[1].trim() : '';

    // Nature + procedure: after fa-file-alt icon
    const natureMatch = box.match(/fa-file-alt"><\/i>([\s\S]*?)<\/p>/);
    const natureRaw = natureMatch ? natureMatch[1].trim() : '';
    const natureParts = natureRaw.split(/\s*-\s*/);
    const nature = mapNature(natureParts[0] || '');
    const procedureType = natureParts[1]?.trim() || null;

    // Deadline: inside <span class="pink">
    const deadlineMatch = box.match(/<span class="pink">\s*([\s\S]*?)\s*<\/span>/);
    const deadlineRaw = deadlineMatch ? deadlineMatch[1].trim() : '';
    const deadline = parseDeadline(deadlineRaw);

    // Link: href to notice detail
    const linkMatch = box.match(/href=["']?([^"'\s>]*\/appel-offre\/[^"'\s>]+)/);
    const link = linkMatch ? linkMatch[1] : null;
    if (!link) continue;

    // Extract sourceRef from the URL path (contains unique notice ID)
    const pathParts = link.replace(/^\//, '').split('/');
    const noticeId = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2];
    const sourceRef = `EMP-${noticeId}`;

    // Department from location
    const dept = extractDepartment(location);
    const deptInfo = DEPT_MAP[dept];

    results.push({
      title: title.slice(0, 500),
      buyer: buyer.slice(0, 300),
      nature,
      department: dept,
      departmentName: deptInfo?.name || null,
      region: deptInfo?.region || null,
      value: null,
      deadline,
      publicationDate: new Date(),
      source: 'E-MARCHESPUBLICS',
      sourceRef,
      procedureType,
      cpvCode: null,
      cpvLabel: null,
      lots: 1,
      duration: null,
      status: 'OUVERT',
    });
  }

  return results;
}

/* ───── Obtenir une session et le CSRF token ───── */
async function getSession(): Promise<{ cookies: string; csrf: string }> {
  const res = await fetch(PAGE_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; AB-DRIDI-Portal/1.0)',
      Accept: 'text/html',
    },
    redirect: 'follow',
  });

  if (!res.ok) {
    throw new Error(`Failed to load ${PAGE_URL}: ${res.status}`);
  }

  // Extract cookies from response headers
  const setCookies = res.headers.getSetCookie?.() || [];
  const cookies = setCookies
    .map((c) => c.split(';')[0])
    .join('; ');

  // Extract CSRF token from HTML
  const html = await res.text();
  const csrfMatch = html.match(/data-csrf="([^"]+)"/);
  if (!csrfMatch) {
    throw new Error('CSRF token not found in page');
  }

  return { cookies, csrf: csrfMatch[1] };
}

/* ───── Fonction principale : récupérer les annonces ───── */
export async function fetchEMarchesPublicsRecords(options?: {
  limit?: number;
}): Promise<EMarchesPublicsMarche[]> {
  const limit = options?.limit ?? 500;

  console.log(`[E-MARCHESPUBLICS] Getting session...`);
  const { cookies, csrf } = await getSession();

  const allRecords: EMarchesPublicsMarche[] = [];
  let page = 1;
  const maxPages = Math.ceil(limit / PER_PAGE);

  while (allRecords.length < limit && page <= maxPages) {
    console.log(`[E-MARCHESPUBLICS] Fetching page ${page}...`);

    const searchPayload = JSON.stringify({
      exclude_ids: [],
      filters: {
        notice_type: 'AAPC',
        date: 'after',
        procedure_type: [],
        what: [],
        where: [],
        is_demo: false,
      },
      sort: [],
      paginate: {
        per_page: PER_PAGE,
        page,
      },
      percentage: null,
    });

    const body = `_token=${encodeURIComponent(csrf)}&search=${encodeURIComponent(searchPayload)}`;

    const res = await fetch(SEARCH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-TOKEN': csrf,
        'User-Agent': 'Mozilla/5.0 (compatible; AB-DRIDI-Portal/1.0)',
        Cookie: cookies,
      },
      body,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Search API error ${res.status}: ${text.slice(0, 200)}`);
    }

    const json = await res.json();
    const viewHtml = json.view || '';
    const nbResult = json.nbResult || 0;

    const records = parseResultsHtml(viewHtml);

    if (records.length === 0) break;

    allRecords.push(...records);

    // Check if we've reached the last page
    const totalPages = Math.ceil(nbResult / PER_PAGE);
    if (page >= totalPages) break;

    page++;
  }

  // Deduplicate by sourceRef
  const seen = new Set<string>();
  const unique = allRecords.filter((r) => {
    if (seen.has(r.sourceRef)) return false;
    seen.add(r.sourceRef);
    return true;
  });

  console.log(`[E-MARCHESPUBLICS] Total records mapped: ${unique.length}`);
  return unique.slice(0, limit);
}
