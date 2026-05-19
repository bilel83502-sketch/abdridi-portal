/**
 * marches-demat.com (Modula Demat) — Récupère les annonces via scraping HTML avec session JSP
 *
 * Méthode : session-based HTML scraping (JSP Java + jsessionid)
 * 1. GET /publisher_portail/ pour obtenir le jsessionid
 * 2. GET /publisher_portail/public/annonce/afficherAnnonces.jsp;jsessionid=XXX
 * 3. Parser le HTML résultant
 */

import * as cheerio from 'cheerio';

const BASE_URL = 'https://www.marches-demat.com';
const PORTAL_URL = `${BASE_URL}/publisher_portail/`;
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

/* ───── Mapping nature ───── */
function mapNature(raw: string): string {
  const t = raw.toUpperCase();
  if (t.includes('TRAVAUX')) return 'TRAVAUX';
  if (t.includes('FOURNITURE')) return 'FOURNITURES';
  if (t.includes('SERVICE')) return 'SERVICES';
  return 'SERVICES';
}

/* ───── Extraction département depuis texte ───── */
function extractDepartment(text: string): string {
  // Try (XX) pattern first
  const match = text.match(/\((\d{2,3}|2[AB])\)/);
  if (match) return match[1];
  // Try postal code (5 digits)
  const postalMatch = text.match(/\b((?:0[1-9]|[1-8]\d|9[0-5]|97[1-6]|2[AB])\d{3})\b/);
  if (postalMatch) {
    const code = postalMatch[1];
    if (code.startsWith('20')) return parseInt(code) >= 20200 ? '2B' : '2A';
    if (code.startsWith('97')) return code.substring(0, 3);
    return code.substring(0, 2);
  }
  return '00';
}

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
  '971': { name: 'Guadeloupe', region: 'Guadeloupe' },
  '972': { name: 'Martinique', region: 'Martinique' },
  '973': { name: 'Guyane', region: 'Guyane' },
  '974': { name: 'La Réunion', region: 'La Réunion' },
  '976': { name: 'Mayotte', region: 'Mayotte' },
};

/* ───── Parse date DD/MM/YYYY ───── */
function parseFrDate(str: string): Date | null {
  const m = str.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!m) return null;
  const d = new Date(`${m[3]}-${m[2]}-${m[1]}T12:00:00+01:00`);
  return isNaN(d.getTime()) ? null : d;
}

/* ───── Type retour ───── */
export interface MarchesDematMarche {
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

/* ───── Obtenir la session JSP ───── */
async function getSession(): Promise<{ jsessionid: string; cookies: string }> {
  const res = await fetch(PORTAL_URL, {
    headers: {
      'User-Agent': UA,
      Accept: 'text/html,application/xhtml+xml',
      'Accept-Language': 'fr-FR,fr;q=0.9',
    },
    redirect: 'manual',
  });

  // Extract jsessionid from redirect URL or response
  const location = res.headers.get('location') || '';
  let jsessionid = '';

  const sessionMatch = location.match(/;jsessionid=([A-F0-9]+)/i);
  if (sessionMatch) {
    jsessionid = sessionMatch[1];
  }

  // Also try from response body if no redirect
  if (!jsessionid) {
    const html = await res.text();
    const bodyMatch = html.match(/jsessionid=([A-F0-9]+)/i);
    if (bodyMatch) {
      jsessionid = bodyMatch[1];
    }
  }

  // Extract cookies
  const setCookies = res.headers.getSetCookie?.() || [];
  const cookies = setCookies.map((c) => c.split(';')[0]).join('; ');

  if (!jsessionid) {
    throw new Error('Could not obtain jsessionid from marches-demat.com');
  }

  return { jsessionid, cookies };
}

/* ───── Parser les annonces depuis le HTML ───── */
function parseAnnonces(html: string): MarchesDematMarche[] {
  const results: MarchesDematMarche[] = [];
  const $ = cheerio.load(html);

  // Look for annonce rows in tables or lists
  $('table tr, .annonce, .ligne, [class*="annonce"]').each((_, el) => {
    const $el = $(el);
    const text = $el.text().trim();
    if (!text || text.length < 20) return;

    // Try to find a detail link with an ID
    const link = $el.find('a[href*="annonce"], a[href*="detail"], a[href*="consultation"]');
    let id = '';
    if (link.length > 0) {
      const href = link.attr('href') || '';
      const idMatch = href.match(/(?:id|ref|annonce|consultation)[=\/](\w+)/i);
      if (idMatch) id = idMatch[1];
      else {
        const numMatch = href.match(/(\d{4,})/);
        if (numMatch) id = numMatch[1];
      }
    }
    if (!id) return;

    // Extract title from link text or first bold element
    const title = link.text().trim() || $el.find('b, strong, .titre').first().text().trim();
    if (!title) return;

    // Filter garbage: pagination elements, short titles, encoding artifacts
    if (title.length < 10) return;
    if (/r[ée]sultat.*par page/i.test(title)) return;
    if (title.includes('�')) return;
    if (/^[\d\s\/]+$/.test(title)) return;

    // Extract buyer
    const cells = $el.find('td');
    let buyer = 'Non précisé';
    let natureRaw = '';
    let deadlineStr = '';

    cells.each((_, cell) => {
      const cellText = $(cell).text().trim();
      if (cellText.match(/\d{2}\/\d{2}\/\d{4}/)) {
        deadlineStr = cellText;
      } else if (cellText.match(/travaux|fourniture|service/i)) {
        natureRaw = cellText;
      } else if (cellText.length > 5 && !cellText.match(/^(Oui|Non|Voir|Détail)/i) && buyer === 'Non précisé') {
        buyer = cellText;
      }
    });

    const deadline = parseFrDate(deadlineStr);

    const dept = extractDepartment(buyer);
    const deptInfo = DEPT_MAP[dept];

    results.push({
      title: title.slice(0, 500),
      buyer: buyer.slice(0, 300),
      nature: mapNature(natureRaw),
      department: dept,
      departmentName: deptInfo?.name || null,
      region: deptInfo?.region || null,
      value: null,
      deadline,
      publicationDate: new Date(),
      source: 'MARCHES-DEMAT',
      sourceRef: `MDEMAT-${id}`,
      procedureType: null,
      cpvCode: null,
      cpvLabel: null,
      lots: 1,
      duration: null,
      status: deadline && deadline < new Date() ? 'FERME' : 'OUVERT',
    });
  });

  return results;
}

/* ───── Fonction principale ───── */
export async function fetchMarchesDematRecords(options?: {
  limit?: number;
}): Promise<MarchesDematMarche[]> {
  const limit = options?.limit ?? 500;

  console.log(`[MARCHES-DEMAT] Getting session from marches-demat.com...`);

  let jsessionid: string;
  let cookies: string;
  try {
    const session = await getSession();
    jsessionid = session.jsessionid;
    cookies = session.cookies;
  } catch (err: any) {
    console.error(`[MARCHES-DEMAT] Failed to get session:`, err?.message);
    return [];
  }

  const allRecords: MarchesDematMarche[] = [];

  try {
    const annoncesUrl = `${BASE_URL}/publisher_portail/public/annonce/afficherAnnonces.jsp;jsessionid=${jsessionid}`;
    console.log(`[MARCHES-DEMAT] Fetching annonces...`);

    const res = await fetch(annoncesUrl, {
      headers: {
        'User-Agent': UA,
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'fr-FR,fr;q=0.9',
        Cookie: cookies,
        Referer: PORTAL_URL,
      },
    });

    if (!res.ok) {
      console.warn(`[MARCHES-DEMAT] Annonces page returned ${res.status}`);
      return [];
    }

    const html = await res.text();
    const records = parseAnnonces(html);
    allRecords.push(...records);
  } catch (err: any) {
    console.error(`[MARCHES-DEMAT] Error fetching annonces:`, err?.message);
  }

  // Deduplicate by sourceRef
  const seen = new Set<string>();
  const unique = allRecords.filter((r) => {
    if (seen.has(r.sourceRef)) return false;
    seen.add(r.sourceRef);
    return true;
  });

  console.log(`[MARCHES-DEMAT] Total unique records: ${unique.length}`);
  return unique.slice(0, limit);
}
