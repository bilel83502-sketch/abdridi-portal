/**
 * xmarches.fr — Récupère les appels d'offres via scraping HTML paginé
 *
 * Méthode : scraping de la liste des consultations paginée
 * URL : https://www.xmarches.fr/entreprise/listeConsultations.php?page={N}
 *
 * Structure HTML :
 *   <tr class="trAnnonce border-bottom-lightgrey">
 *     <td class="td_ref"><a href="./detailConsultation.php?key=XXXXX">REF</a></td>
 *     <td class="td_objet_consult">
 *       <h5 class="color-theme">TITLE</h5>
 *       <span>CATEGORY</span>
 *       Mode passation : TEXT
 *     </td>
 *     <td>DATE_LIMITE</td>
 *     <td><strong>BUYER</strong></td>
 *   </tr>
 *
 * Pagination : ?page=N (10 résultats/page, ~25 pages pour ~245 résultats)
 */

import * as cheerio from 'cheerio';

const BASE_URL = 'https://www.xmarches.fr/entreprise';
const LIST_URL = `${BASE_URL}/listeConsultations.php`;
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

/* ───── Mapping nature ───── */
function mapNature(raw: string): string {
  const t = raw.toUpperCase();
  if (t.includes('TRAVAUX')) return 'TRAVAUX';
  if (t.includes('FOURNITURE')) return 'FOURNITURES';
  if (t.includes('SERVICE')) return 'SERVICES';
  if (t.includes('HÔTELLERIE') || t.includes('HOTELLERIE') || t.includes('RESTAURATION')) return 'SERVICES';
  return 'SERVICES';
}

/* ───── Parse deadline "20/03/2026 à 11:00:00" ───── */
function parseDeadline(raw: string): Date | null {
  const match = raw.match(/(\d{2})\/(\d{2})\/(\d{4})\s*(?:à|a)\s*(\d{2}):(\d{2}):?(\d{2})?/);
  if (match) {
    const [, day, month, year, hours, minutes] = match;
    const d = new Date(`${year}-${month}-${day}T${hours}:${minutes}:00+01:00`);
    if (!isNaN(d.getTime())) return d;
  }
  const dateMatch = raw.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (dateMatch) {
    const [, day, month, year] = dateMatch;
    const d = new Date(`${year}-${month}-${day}T12:00:00+01:00`);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

/* ───── Type retour ───── */
export interface XmarchesMarche {
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

/* ───── Parser une page de résultats ───── */
function parseListPage(html: string): XmarchesMarche[] {
  const results: XmarchesMarche[] = [];
  const $ = cheerio.load(html);

  $('tr.trAnnonce').each((_, row) => {
    const $row = $(row);

    // Key depuis le lien detailConsultation
    const link = $row.find('a[href*="detailConsultation.php"]').first();
    if (link.length === 0) return;

    const href = link.attr('href') || '';
    const keyMatch = href.match(/key=(\d+)/);
    if (!keyMatch) return;
    const key = keyMatch[1];

    // Titre depuis <h5 class="color-theme">
    const title = $row.find('h5.color-theme').text().trim() ||
      (link.attr('title') || '').replace(/^Accéder à la consultation\s*/i, '').trim();
    if (!title) return;

    // Catégorie / nature depuis le <span> dans td_objet_consult
    const categoryRaw = $row.find('td.td_objet_consult span').first().text().trim();
    const nature = mapNature(categoryRaw);

    // Mode de passation
    const objet = $row.find('td.td_objet_consult').text();
    const modeMatch = objet.match(/Mode passation\s*:\s*([^\n<]+)/i);
    const procedureType = modeMatch ? modeMatch[1].trim().slice(0, 200) : null;

    // Date limite (3ème <td> — texte brut)
    const cells = $row.find('td');
    const deadlineStr = $(cells[2]).text().trim();
    const deadline = parseDeadline(deadlineStr);

    // Acheteur — <strong> ou <b> dans le dernier <td>
    const lastTd = $row.find('td').last();
    const buyer = (lastTd.find('strong').text().trim() || lastTd.find('b').text().trim() || 'Non précisé');

    // Département depuis l'URL du logo adherent: GC02001.png, CG52001.png, GC2A001.png
    const logoImg = lastTd.find('img[src*="logoadherents"]').attr('src') || '';
    const deptMatch = logoImg.match(/(?:GC|CG|CR|CA|CC|GE|CE|SD|SM)(\d{2,3}|2[AB])\d*/i);
    const dept = deptMatch ? deptMatch[1].padStart(2, '0') : '00';
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
      publicationDate: new Date(new Date().toISOString().split('T')[0] + 'T00:00:00Z'),
      source: 'XMARCHES',
      sourceRef: `XMARCHES-${key}`,
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

/* ───── Fonction principale ───── */
export async function fetchXmarchesRecords(options?: {
  limit?: number;
}): Promise<XmarchesMarche[]> {
  const limit = options?.limit ?? 500;
  const allRecords: XmarchesMarche[] = [];

  console.log(`[XMARCHES] Fetching consultations from xmarches.fr (limit ${limit})...`);

  for (let page = 1; allRecords.length < limit && page <= 50; page++) {
    const url = `${LIST_URL}?page=${page}`;
    console.log(`[XMARCHES] Fetching page ${page}...`);

    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': UA,
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Language': 'fr-FR,fr;q=0.9',
          Referer: 'https://www.xmarches.fr/entreprise/',
        },
      });

      if (!res.ok) {
        console.warn(`[XMARCHES] Page ${page} returned ${res.status}`);
        break;
      }

      const html = await res.text();
      const records = parseListPage(html);

      console.log(`[XMARCHES] Page ${page}: ${records.length} consultations`);
      if (records.length === 0) break;
      allRecords.push(...records);

      // Polite delay
      await new Promise((r) => setTimeout(r, 400));
    } catch (err: any) {
      console.error(`[XMARCHES] Error on page ${page}:`, err?.message);
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

  console.log(`[XMARCHES] Total unique records: ${unique.length}`);
  return unique.slice(0, limit);
}
