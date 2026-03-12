/**
 * achatpublic.com (Atexo/Acceleo) — Récupère les appels d'offres via la salle des marchés
 * 2e plus gros éditeur de profils d'acheteurs privés en France
 *
 * Méthode : POST sur rechercheCsl.action avec session JSESSIONID.
 * Page initiale = recherche vide, pagination via searchCslBean.page (0-indexed).
 */

const BASE_URL = 'https://www.achatpublic.com';
const SEARCH_PAGE = `${BASE_URL}/sdm/ent2/gen/recherche.do`;
const SEARCH_ACTION = `${BASE_URL}/sdm/ent2/gen/rechercheCsl.action`;
const ITEMS_PER_PAGE = 10;
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

/* ───── Mois français → numéro ───── */
const MONTH_MAP: Record<string, string> = {
  'janvier': '01', 'jan': '01', 'janv': '01',
  'février': '02', 'fev': '02', 'fevr': '02', 'fév': '02',
  'mars': '03', 'mar': '03',
  'avril': '04', 'avr': '04',
  'mai': '05',
  'juin': '06', 'jun': '06',
  'juillet': '07', 'juil': '07', 'jul': '07',
  'août': '08', 'aout': '08', 'aoû': '08',
  'septembre': '09', 'sept': '09', 'sep': '09',
  'octobre': '10', 'oct': '10',
  'novembre': '11', 'nov': '11',
  'décembre': '12', 'dec': '12', 'déc': '12',
};

function parseFrenchMonth(raw: string): string {
  const clean = raw.toLowerCase().replace(/\./g, '').trim();
  return MONTH_MAP[clean] || '01';
}

/* ───── Mapping nature ───── */
function mapNature(raw: string): string {
  const t = raw.toUpperCase();
  if (t.includes('TRAVAUX')) return 'TRAVAUX';
  if (t.includes('FOURNITURE')) return 'FOURNITURES';
  if (t.includes('SERVICE')) return 'SERVICES';
  return 'SERVICES';
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
    .replace(/&eacute;/g, 'é')
    .replace(/&egrave;/g, 'è')
    .replace(/&agrave;/g, 'à')
    .replace(/&ecirc;/g, 'ê')
    .replace(/&ocirc;/g, 'ô')
    .replace(/&ucirc;/g, 'û')
    .replace(/&ccedil;/g, 'ç')
    .replace(/&iuml;/g, 'ï')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)))
    .replace(/<[^>]+>/g, '')
    .trim();
}

/* ───── Extraction département depuis texte ───── */
function extractDepartment(text: string): string {
  const match = text.match(/\((\d{2,3}|2[AB])\)/);
  if (match) return match[1];
  const postalMatch = text.match(/\b((?:0[1-9]|[1-8]\d|9[0-5]|97[1-6]|2[AB])\d{3})\b/);
  if (postalMatch) {
    const code = postalMatch[1];
    if (code.startsWith('20')) return parseInt(code) >= 20200 ? '2B' : '2A';
    if (code.startsWith('97')) return code.substring(0, 3);
    return code.substring(0, 2);
  }
  return '00';
}

/* ───── Type retour ───── */
export interface AchatPublicMarche {
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

/* ───── Parser les résultats HTML ───── */
function parseResultsHtml(html: string): AchatPublicMarche[] {
  const results: AchatPublicMarche[] = [];
  const items = html.split('class="jqTriggableCard');

  for (let i = 1; i < items.length; i++) {
    const item = items[i];

    // PCSLID (unique consultation ID)
    const pcslMatch = item.match(/PCSLID=([^&"]+)/);
    const pcslId = pcslMatch?.[1];
    if (!pcslId) continue;

    // Title
    const titleMatch = item.match(/sdmCardGeneric__topLink[^>]*>\s*([\s\S]*?)\s*<\/a>/);
    const title = titleMatch ? decodeHtml(titleMatch[1]) : '';
    if (!title) continue;

    // Deadline
    const deadlineDayMatch = item.match(/numberTime[^>]*>(\d+)</);
    const deadlineMonthYearMatch = item.match(/ddyyyy[^>]*>(\w+)\s+(\d{4})</);
    const deadlineTimeMatch = item.match(/preciseTime[^>]*>(\d+)\s*:\s*(\d+)</);
    let deadline: Date | null = null;
    if (deadlineDayMatch && deadlineMonthYearMatch) {
      const dd = deadlineDayMatch[1].padStart(2, '0');
      const mm = parseFrenchMonth(deadlineMonthYearMatch[1]);
      const yyyy = deadlineMonthYearMatch[2];
      const hh = deadlineTimeMatch ? deadlineTimeMatch[1].padStart(2, '0') : '12';
      const min = deadlineTimeMatch ? deadlineTimeMatch[2] : '00';
      deadline = new Date(`${yyyy}-${mm}-${dd}T${hh}:${min}:00+01:00`);
      if (isNaN(deadline.getTime())) deadline = null;
    }

    // Organisme (buyer)
    const orgMatch = item.match(/Organisme[\s\S]*?same-content-title">([\s\S]*?)<\/span/);
    const buyer = orgMatch ? decodeHtml(orgMatch[1]).slice(0, 300) : 'Non précisé';

    // Reference
    const refMatch = item.match(/rence[\s\S]*?same-content-title">([\s\S]*?)<\/span/);
    const reference = refMatch ? decodeHtml(refMatch[1]) : '';

    // Nature/Type
    const typeMatch = item.match(/(?:Type de march|Nature)[\s\S]*?same-content-title">([\s\S]*?)<\/span/);
    const nature = typeMatch ? mapNature(decodeHtml(typeMatch[1])) : 'SERVICES';

    // Procedure
    const procMatch = item.match(/Proc[\s\S]*?same-content-title">([\s\S]*?)<\/span/);
    const procedureType = procMatch ? decodeHtml(procMatch[1]).slice(0, 200) : null;

    // Lieu/Department
    const lieuMatch = item.match(/(?:Lieu|partement)[\s\S]*?same-content-title">([\s\S]*?)<\/span/);
    const lieuText = lieuMatch ? decodeHtml(lieuMatch[1]) : '';
    const dept = extractDepartment(lieuText || buyer);
    const deptInfo = DEPT_MAP[dept];

    // Build display title
    const fullTitle = reference ? `${reference} — ${title}` : title;

    results.push({
      title: fullTitle.slice(0, 500),
      buyer,
      nature,
      department: dept,
      departmentName: deptInfo?.name || null,
      region: deptInfo?.region || null,
      value: null,
      deadline,
      publicationDate: new Date(),
      source: 'ACHATPUBLIC',
      sourceRef: `ACHATPUBLIC-${pcslId}`,
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

/* ───── Extraire le nombre total de résultats ───── */
function extractTotalResults(html: string): number {
  const m = html.match(/textLatoBold--24">(\d+)<\/span>/);
  return m ? parseInt(m[1]) : 0;
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
    await new Promise((r) => setTimeout(r, 1000 * attempt));
  }
  throw new Error('Unreachable');
}

/* ───── Fonction principale ───── */
export async function fetchAchatPublicRecords(options?: {
  limit?: number;
}): Promise<AchatPublicMarche[]> {
  const limit = options?.limit ?? 200;

  console.log(`[ACHATPUBLIC] Getting session...`);

  // Step 1: GET search page to establish JSESSIONID
  const initRes = await fetchWithRetry(SEARCH_PAGE, {
    headers: { 'User-Agent': UA, Accept: 'text/html' },
    redirect: 'follow',
  });

  const setCookies = initRes.headers.getSetCookie?.() || [];
  const cookies = setCookies.map((c) => c.split(';')[0]).join('; ');
  await initRes.text(); // consume body

  // Step 2: POST initial search (page 1)
  console.log(`[ACHATPUBLIC] Submitting search...`);

  const initialBody = new URLSearchParams({
    'searchCslBean.initial': '0',
    'searchCslBean.intitule': '',
    'searchCslBean.marche': '2',
    'searchCslBean.procedure': '-1',
    'searchCslBean.region': '',
    'searchCslBean.departement': '',
    'searchCslBean.dlrpStart': '',
    'searchCslBean.dlrpEnd': '',
    'searchCslBean.codeCPV': '',
    'codeCPV': '',
    'nextAction': '',
  });

  const searchRes = await fetchWithRetry(SEARCH_ACTION, {
    method: 'POST',
    headers: {
      'User-Agent': UA,
      Accept: 'text/html',
      'Content-Type': 'application/x-www-form-urlencoded',
      Referer: SEARCH_PAGE,
      Cookie: cookies,
    },
    body: initialBody.toString(),
    redirect: 'follow',
  });

  let html = await searchRes.text();
  let totalResults = extractTotalResults(html);
  let records = parseResultsHtml(html);

  console.log(`[ACHATPUBLIC] Page 1: ${records.length} items (${totalResults} total)`);

  const allRecords: AchatPublicMarche[] = [...records];
  const maxPages = Math.min(Math.ceil(limit / ITEMS_PER_PAGE), Math.ceil(totalResults / ITEMS_PER_PAGE));

  // Step 3: Paginate using hiddenForm pattern (0-indexed: page=0 is already loaded, page=1 is next)
  for (let pageIdx = 1; pageIdx < maxPages && allRecords.length < limit; pageIdx++) {
    await new Promise((r) => setTimeout(r, 1500));

    console.log(`[ACHATPUBLIC] Fetching page ${pageIdx + 1}/${maxPages}...`);

    const pageBody = new URLSearchParams({
      'searchCslBean.departement': '',
      'searchCslBean.intitule': '',
      'searchCslBean.objetRecherche': '',
      'searchCslBean.reference': '',
      'searchCslBean.procedure': '-1',
      'searchCslBean.marche': '2',
      'searchCslBean.codeCPV': '',
      'searchCslBean.typeLieu': '',
      'searchCslBean.avecAspectEnvironnement': '',
      'searchCslBean.avecAspectSocial': '',
      'searchCslBean.avisConsultation': '',
      'searchCslBean.avec_Esignature': '',
      'searchCslBean.edume': '',
      'searchCslBean.lots': '',
      'searchCslBean.dlrpStart': '',
      'searchCslBean.dlrpEnd': '',
      'searchCslBean.page': pageIdx.toString(),
      'searchCslBean.orderby': '',
    });

    try {
      const pageRes = await fetchWithRetry(SEARCH_ACTION, {
        method: 'POST',
        headers: {
          'User-Agent': UA,
          Accept: 'text/html',
          'Content-Type': 'application/x-www-form-urlencoded',
          Referer: SEARCH_ACTION,
          Cookie: cookies,
        },
        body: pageBody.toString(),
        redirect: 'follow',
      });

      html = await pageRes.text();
      records = parseResultsHtml(html);

      if (records.length === 0) {
        console.log(`[ACHATPUBLIC] No results on page ${pageIdx + 1}, stopping`);
        break;
      }

      allRecords.push(...records);
      console.log(`[ACHATPUBLIC] Page ${pageIdx + 1}: ${records.length} items (total: ${allRecords.length})`);
    } catch (e: any) {
      console.error(`[ACHATPUBLIC] Error on page ${pageIdx + 1}: ${e.message}`);
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

  console.log(`[ACHATPUBLIC] Total records mapped: ${unique.length}`);
  return unique.slice(0, limit);
}
