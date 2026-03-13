/**
 * Marchés Online — marchesonline.com
 *
 * Le site est un SPA Nuxt (serverRendered:false) → le HTML côté serveur est vide.
 * On cherche leur API backend dans cet ordre :
 *   1. /api/avis?page=1&limit=20
 *   2. /api/v1/avis?page=1&limit=20
 *   3. /api/annonces?page=1&limit=20
 *   4. Flux RSS : /rss ou /feed.xml
 *
 * // TODO: Endpoint qui a fonctionné : à renseigner après test
 */

const BASE_URL = 'https://www.marchesonline.com';
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

/* ───── API endpoints to try ───── */
const API_ENDPOINTS = [
  `${BASE_URL}/api/avis`,
  `${BASE_URL}/api/v1/avis`,
  `${BASE_URL}/api/annonces`,
  `${BASE_URL}/api/v1/annonces`,
  `${BASE_URL}/api/consultations`,
];

const RSS_ENDPOINTS = [
  `${BASE_URL}/rss`,
  `${BASE_URL}/feed.xml`,
  `${BASE_URL}/rss.xml`,
  `${BASE_URL}/flux-rss`,
];

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

/* ───── Map un item JSON vers notre format ───── */
function mapJsonItem(item: any): MarchesOnlineMarche | null {
  const id = item.id || item._id || item.reference || item.numero;
  if (!id) return null;

  const title = (item.objet || item.title || item.titre || item.intitule || '').trim();
  if (!title) return null;

  const buyer = (item.acheteur || item.organisme || item.buyer || item.collectivite || '').trim();

  // Department extraction
  let dept = '00';
  const deptField = item.departement || item.department || item.codeDepartement || '';
  const deptMatch = String(deptField).match(/^(\d{2,3}|2[AB])/);
  if (deptMatch) dept = deptMatch[1];
  const deptInfo = DEPT_MAP[dept];

  // Deadline
  let deadline: Date | null = null;
  const deadlineRaw = item.dateLimite || item.dateRemise || item.deadline || item.dateCloture;
  if (deadlineRaw) {
    const d = new Date(deadlineRaw);
    if (!isNaN(d.getTime())) deadline = d;
  }

  // Publication date
  let publicationDate: Date | null = null;
  const pubRaw = item.datePublication || item.dateParution || item.createdAt || item.date;
  if (pubRaw) {
    const d = new Date(pubRaw);
    if (!isNaN(d.getTime())) publicationDate = d;
  }

  const nature = mapNature(item.nature || item.type || item.typeMarche || '');

  return {
    title: title.slice(0, 500),
    buyer: buyer.slice(0, 300) || 'Marchés Online',
    nature,
    department: dept,
    departmentName: deptInfo?.name || null,
    region: deptInfo?.region || null,
    value: item.montant ? parseFloat(item.montant) : null,
    deadline,
    publicationDate,
    source: 'MARCHES-ONLINE',
    sourceRef: `MONL-${id}`,
    procedureType: item.procedure || item.typeProcedure || null,
    cpvCode: item.cpv || item.codeCpv || null,
    cpvLabel: item.cpvLabel || item.libelleCpv || null,
    lots: item.nbLots || item.lots || 1,
    duration: item.duree || item.duration || null,
    status: 'OUVERT',
  };
}

/* ───── Parse RSS/Atom feed ───── */
function parseRssFeed(xml: string): MarchesOnlineMarche[] {
  const results: MarchesOnlineMarche[] = [];
  // Simple regex-based RSS parsing
  const items = xml.split(/<item[\s>]/);

  for (let i = 1; i < items.length; i++) {
    const item = items[i];

    const titleMatch = item.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/);
    const linkMatch = item.match(/<link[^>]*>([\s\S]*?)<\/link>/);
    const descMatch = item.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/);
    const pubDateMatch = item.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/);
    const guidMatch = item.match(/<guid[^>]*>([\s\S]*?)<\/guid>/);

    const title = (titleMatch?.[1] || '').replace(/<[^>]+>/g, '').trim();
    if (!title) continue;

    const link = (linkMatch?.[1] || '').trim();
    const guid = (guidMatch?.[1] || link || '').trim();
    const idMatch = guid.match(/(\d{5,})/);
    const id = idMatch ? idMatch[1] : String(i);

    const desc = (descMatch?.[1] || '').replace(/<[^>]+>/g, '').trim();

    let publicationDate: Date | null = null;
    if (pubDateMatch) {
      const d = new Date(pubDateMatch[1].trim());
      if (!isNaN(d.getTime())) publicationDate = d;
    }

    // Try to extract department from description or title
    let dept = '00';
    const deptMatch = (desc + ' ' + title).match(/\b(97[1-6]|0[1-9]|[1-8]\d|9[0-5]|2[AB])\b/);
    if (deptMatch) dept = deptMatch[1];
    const deptInfo = DEPT_MAP[dept];

    const nature = mapNature(desc + ' ' + title);

    results.push({
      title: title.slice(0, 500),
      buyer: 'Marchés Online',
      nature,
      department: dept,
      departmentName: deptInfo?.name || null,
      region: deptInfo?.region || null,
      value: null,
      deadline: null,
      publicationDate,
      source: 'MARCHES-ONLINE',
      sourceRef: `MONL-${id}`,
      procedureType: null,
      cpvCode: null,
      cpvLabel: null,
      lots: 1,
      duration: null,
      status: 'OUVERT',
    });
  }

  return results;
}

/* ───── Discover working endpoint ───── */
async function discoverEndpoint(): Promise<{ type: 'json' | 'rss'; url: string } | null> {
  const headers: Record<string, string> = {
    'User-Agent': UA,
    Accept: 'application/json',
    Referer: `${BASE_URL}/`,
  };

  // Try JSON API endpoints first
  for (const endpoint of API_ENDPOINTS) {
    console.log(`[MONL] Trying API: ${endpoint}`);
    const res = await fetchWithRetry(`${endpoint}?page=1&limit=5`, { headers }, 1);
    if (res) {
      const text = await res.text();
      try {
        const json = JSON.parse(text);
        if (json && (Array.isArray(json) || json.data || json.results || json.items || json.avis)) {
          console.log(`[MONL] Found working JSON API: ${endpoint}`);
          return { type: 'json', url: endpoint };
        }
      } catch {
        // Not JSON, continue
      }
    }
  }

  // Try RSS endpoints
  for (const endpoint of RSS_ENDPOINTS) {
    console.log(`[MONL] Trying RSS: ${endpoint}`);
    const res = await fetchWithRetry(endpoint, {
      headers: { 'User-Agent': UA, Accept: 'application/xml, text/xml, application/rss+xml' },
    }, 1);
    if (res) {
      const text = await res.text();
      if (text.includes('<rss') || text.includes('<feed') || text.includes('<item')) {
        console.log(`[MONL] Found working RSS: ${endpoint}`);
        return { type: 'rss', url: endpoint };
      }
    }
  }

  return null;
}

/* ───── Fonction principale ───── */
export async function fetchMarchesOnlineRecords(options?: {
  limit?: number;
}): Promise<MarchesOnlineMarche[]> {
  const limit = options?.limit ?? 200;
  const allRecords: MarchesOnlineMarche[] = [];

  console.log(`[MONL] Discovering marchesonline.com endpoint...`);

  const endpoint = await discoverEndpoint();

  if (!endpoint) {
    console.error('[MONL] No working API or RSS endpoint found');
    // TODO: Si aucun endpoint ne fonctionne, investiguer les requêtes réseau du SPA Nuxt
    // pour découvrir le vrai endpoint API backend
    return [];
  }

  if (endpoint.type === 'rss') {
    // RSS mode — single fetch, limited data
    const res = await fetchWithRetry(endpoint.url, {
      headers: { 'User-Agent': UA, Accept: 'application/xml, text/xml' },
    });
    if (!res) return [];
    const xml = await res.text();
    const records = parseRssFeed(xml);
    allRecords.push(...records);
    console.log(`[MONL] RSS: ${records.length} items`);
  } else {
    // JSON API mode — paginate
    const headers: Record<string, string> = {
      'User-Agent': UA,
      Accept: 'application/json',
      Referer: `${BASE_URL}/`,
    };

    const maxPages = Math.ceil(limit / PAGE_SIZE);

    for (let page = 1; page <= maxPages && allRecords.length < limit; page++) {
      if (page > 1) await new Promise((r) => setTimeout(r, 1500));

      const url = `${endpoint.url}?page=${page}&limit=${PAGE_SIZE}`;
      const res = await fetchWithRetry(url, { headers });
      if (!res) {
        console.warn(`[MONL] Page ${page} failed, stopping`);
        break;
      }

      const json = await res.json();
      const items = Array.isArray(json) ? json : (json.data || json.results || json.items || json.avis || []);

      if (items.length === 0) {
        console.log(`[MONL] No more results at page ${page}`);
        break;
      }

      for (const item of items) {
        const mapped = mapJsonItem(item);
        if (mapped) allRecords.push(mapped);
      }

      console.log(`[MONL] Page ${page}: ${items.length} items (total: ${allRecords.length})`);
    }
  }

  // Deduplicate by sourceRef
  const seen = new Set<string>();
  const unique = allRecords.filter((r) => {
    if (seen.has(r.sourceRef)) return false;
    seen.add(r.sourceRef);
    return true;
  });

  console.log(`[MONL] Total records mapped: ${unique.length}`);
  return unique.slice(0, limit);
}
