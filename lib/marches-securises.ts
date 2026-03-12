/**
 * Marchés Sécurisés — Couvre AURA, Occitanie et autres régions
 * https://www.marches-securises.fr
 * Multi-régional (Atline Services)
 *
 * Méthode : scraping HTML de la liste publique des consultations en cours.
 * Pagination URL : ?module=liste_consultations&page=X&presta=...
 * Les consultations les plus récentes sont en fin de pagination,
 * on pagine donc depuis la dernière page vers la première.
 */

const BASE_URL = 'https://www.marches-securises.fr';
const LIST_URL = `${BASE_URL}/entreprise/?module=liste_consultations&presta=%3Bservices%3Btravaux%3Bfournitures%3Bautres`;
const PAGE_SIZE = 10;
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

/* ───── Mapping mois français ───── */
const MONTH_MAP: Record<string, string> = {
  'janvier': '01', 'février': '02', 'mars': '03', 'avril': '04',
  'mai': '05', 'juin': '06', 'juillet': '07', 'août': '08',
  'septembre': '09', 'octobre': '10', 'novembre': '11', 'décembre': '12',
  'fevrier': '02', 'aout': '08', 'decembre': '12',
};

function parseFrenchDate(raw: string): Date | null {
  // "16 février 2026" or "vendredi 13 mars 2026 - 12:00 (...)"
  const m = raw.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
  if (!m) return null;
  const mm = MONTH_MAP[m[2].toLowerCase()];
  if (!mm) return null;
  const dd = m[1].padStart(2, '0');
  // Extract time if present
  const timeMatch = raw.match(/(\d{1,2}:\d{2})/);
  const time = timeMatch ? timeMatch[1] : '12:00';
  return new Date(`${m[3]}-${mm}-${dd}T${time}:00+01:00`);
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
export interface MarchesSecurisesMarche {
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
function parseResultsHtml(html: string): MarchesSecurisesMarche[] {
  const results: MarchesSecurisesMarche[] = [];
  // Split by consultation table blocks
  const items = html.split('<table class="consultation');

  for (let i = 1; i < items.length; i++) {
    const item = items[i];

    // cle_dce = unique consultation key (used in addToFavoris and links)
    const cleMatch = item.match(/addToFavoris\('([^']+)'/);
    const cleDce = cleMatch?.[1];
    if (!cleDce) continue;

    // Buyer: in tr_pa row — "Nom Organisme (XX)"
    const paMatch = item.match(/tr_pa[\s\S]*?<td[^>]*>([^<]+)/);
    const paRaw = paMatch ? decodeHtml(paMatch[1]).replace(/<!--[\s\S]*?-->/, '').trim() : '';
    // Extract dept from buyer name: "Organisme (XX)"
    const paDeptMatch = paRaw.match(/\((\d{2,3}|2[AB])\)\s*$/);
    const dept = paDeptMatch ? paDeptMatch[1] : '00';
    const buyer = paRaw.replace(/\s*\(\d{2,3}|2[AB]\)\s*$/, '').trim() || 'Marchés Sécurisés';

    // Title/Object: in tr_objet row
    const objMatch = item.match(/class="objet"[\s\S]*?max-width:\d+px;">([^<]+)/);
    const title = objMatch ? decodeHtml(objMatch[1]) : '';
    if (!title) continue;

    // Skip test consultations
    if (title.toUpperCase().includes('CONSULTATION DE TEST') || title.toUpperCase().includes('NE PAS UTILISER')) {
      continue;
    }

    // Reference: in tr_identifiant row — second <th>
    const refMatch = item.match(/tr_identifiant[\s\S]*?<th[^>]*>Référence<\/th>[\s\S]*?<th[^>]*>([^<]+)/);
    const reference = refMatch ? decodeHtml(refMatch[1]) : '';

    // Type/Nature: in tr_type row — "Public (...) / Services"
    const typeMatch = item.match(/tr_type[\s\S]*?<td[^>]*>([^<]+)/);
    const typeRaw = typeMatch ? typeMatch[1].trim() : '';
    const nature = mapNature(typeRaw);

    // Procedure: in tr_proc row
    const procMatch = item.match(/tr_proc[\s\S]*?<td[^>]*>([^<]+)/);
    const procedureType = procMatch ? decodeHtml(procMatch[1]).trim() : null;

    // Lots: "X lots" in tr_proc row
    const lotsMatch = item.match(/(\d+)\s*lots?/i);
    const lots = lotsMatch ? parseInt(lotsMatch[1]) : 1;

    // Department: in tr_dept row — "XX Nom"
    const deptRowMatch = item.match(/tr_dept[\s\S]*?<td[^>]*>([^<]+)/);
    const deptText = deptRowMatch ? deptRowMatch[1].trim() : '';
    const deptCodeMatch = deptText.match(/^(\d{2,3}|2[AB])\b/);
    const finalDept = deptCodeMatch ? deptCodeMatch[1] : dept;
    const deptInfo = DEPT_MAP[finalDept];

    // Publication date: td_pub_date — "16 février 2026"
    const pubMatch = item.match(/td_pub_date">([^<]+)/);
    const publicationDate = pubMatch ? parseFrenchDate(pubMatch[1]) : null;

    // Deadline: td_clot_date — "vendredi 13 mars 2026 - 12:00 (...)"
    const deadlineMatch = item.match(/td_clot_date">([^<]+)/);
    const deadline = deadlineMatch ? parseFrenchDate(deadlineMatch[1]) : null;

    results.push({
      title: reference ? `${reference} — ${title}`.slice(0, 500) : title.slice(0, 500),
      buyer: buyer.slice(0, 300),
      nature,
      department: finalDept,
      departmentName: deptInfo?.name || null,
      region: deptInfo?.region || null,
      value: null,
      deadline,
      publicationDate,
      source: 'MARCHES-SECURISES',
      sourceRef: `MSEC-${cleDce}`,
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

/* ───── Extract total pages from pagination ───── */
function extractTotalPages(html: string): number {
  // Look for the last page number in pagination links
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
    } catch (e) {
      if (attempt === maxRetries) return null;
    }
    await new Promise((r) => setTimeout(r, 1000 * attempt));
  }
  return null;
}

/* ───── Fonction principale ───── */
export async function fetchMarchesSecurisesRecords(options?: {
  limit?: number;
}): Promise<MarchesSecurisesMarche[]> {
  const limit = options?.limit ?? 200;
  const allRecords: MarchesSecurisesMarche[] = [];

  console.log(`[MSEC] Fetching consultations list...`);

  // Step 1: Get session cookie
  const initRes = await fetchWithRetry(`${BASE_URL}/entreprise/`, {
    headers: { 'User-Agent': UA },
    redirect: 'manual',
  });
  const setCookies = initRes?.headers.getSetCookie?.() || [];
  const cookies = setCookies.map((c) => c.split(';')[0]).join('; ');

  // Step 2: Submit search to set session state
  await fetchWithRetry(
    `${BASE_URL}/entreprise/?module=consultation|script|selection_consultation_s`,
    {
      method: 'POST',
      headers: {
        'User-Agent': UA,
        'Content-Type': 'application/x-www-form-urlencoded',
        Cookie: cookies,
        Referer: `${BASE_URL}/entreprise/?module=recherche_consultations`,
      },
      body: 'module=liste_consultations&mots_cles=&presta_au=1&presta_et=1&presta_se=1&presta_tx=1&presta_fo=1',
      redirect: 'manual',
    },
  );

  // Step 3: Fetch first page to get total pages
  const firstPageRes = await fetchWithRetry(`${LIST_URL}&page=1`, {
    headers: { 'User-Agent': UA, Cookie: cookies },
  });

  if (!firstPageRes) {
    console.error('[MSEC] Failed to fetch first page');
    return [];
  }

  const firstHtml = await firstPageRes.text();
  const totalPages = extractTotalPages(firstHtml);
  console.log(`[MSEC] ${totalPages} pages found (${totalPages * PAGE_SIZE} consultations approx.)`);

  // Paginate from last page backwards (newest first)
  const maxPagesNeeded = Math.ceil(limit / PAGE_SIZE);
  const startPage = totalPages;
  const endPage = Math.max(1, totalPages - maxPagesNeeded + 1);

  for (let page = startPage; page >= endPage && allRecords.length < limit; page--) {
    if (page < startPage) {
      await new Promise((r) => setTimeout(r, 1500));
    }

    const url = `${LIST_URL}&page=${page}`;

    const res = await fetchWithRetry(url, {
      headers: { 'User-Agent': UA, Cookie: cookies },
    });

    if (!res) {
      console.warn(`[MSEC] Page ${page} failed, skipping`);
      continue;
    }

    const html = await res.text();
    const records = parseResultsHtml(html);

    if (records.length === 0) {
      console.log(`[MSEC] No results on page ${page}, skipping`);
      continue;
    }

    allRecords.push(...records);
    console.log(`[MSEC] Page ${page}: ${records.length} items (total: ${allRecords.length})`);
  }

  // Deduplicate by sourceRef
  const seen = new Set<string>();
  const unique = allRecords.filter((r) => {
    if (seen.has(r.sourceRef)) return false;
    seen.add(r.sourceRef);
    return true;
  });

  console.log(`[MSEC] Total records mapped: ${unique.length}`);
  return unique.slice(0, limit);
}
