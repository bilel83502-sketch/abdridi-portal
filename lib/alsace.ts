/**
 * Alsace — Marchés publics d'Alsace (Bas-Rhin / Haut-Rhin)
 * https://www.marchespublics67.fr
 * Départements 67 (Bas-Rhin) et 68 (Haut-Rhin)
 *
 * Méthode : API REST JSON-LD publique /api/v2/consultations
 * Plateforme ATEXO probable (même que Mégalis/Maximilien).
 * Pagination avec itemsPerPage=2 (seule valeur acceptée par le serveur).
 * TODO: Vérifier la vraie URL — peut être marchespublics.alsace ou marches.alsace
 */

// TODO: Vérifier si c'est marchespublics67.fr, marches.alsace, ou autre URL
const BASE_URL = 'https://www.marchespublics67.fr';
const API_URL = `${BASE_URL}/api/v2/consultations`;
const PAGE_SIZE = 2;
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
export interface AlsaceMarche {
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

/* ───── Mapper un item de l'API vers notre modèle ───── */
function mapRecord(item: any): AlsaceMarche | null {
  const id = item.id;
  if (!id) return null;

  const title = (item.intitule || item.objet || '').trim();
  if (!title) return null;

  // Skip test consultations
  if (title.toUpperCase().includes('NE PAS UTILISER') || title.toUpperCase().includes('CONSULTATION TECHNIQUE TEST')) {
    return null;
  }

  const buyer = (item.organismeDenomination || 'Alsace Marchés').trim();
  const nature = mapNature(item.naturePrestationLibelle || 'Services');
  const procedureType = item.typeProcedureLibelle || null;
  const cpvCode = item.codeCpvPrincipal || null;

  // Department: first from lieuxExecution array, default to 67 (Bas-Rhin)
  const lieux: string[] = item.lieuxExecution || [];
  const dept = lieux.find((l: string) => /^\d{2,3}$/.test(l) || /^2[AB]$/.test(l)) || '67';
  const deptInfo = DEPT_MAP[dept];

  // Dates
  const deadline = item.dateLimiteRemisePlis ? new Date(item.dateLimiteRemisePlis) : null;
  const publicationDate = item.dateMiseEnLigneCalcule ? new Date(item.dateMiseEnLigneCalcule) : null;

  // Value
  const value = typeof item.valeurEstimee === 'number' && item.valeurEstimee > 0
    ? item.valeurEstimee
    : null;

  // Reference
  const reference = item.reference || '';

  return {
    title: reference ? `${reference} — ${title}`.slice(0, 500) : title.slice(0, 500),
    buyer: buyer.slice(0, 300),
    nature,
    department: dept,
    departmentName: deptInfo?.name || null,
    region: deptInfo?.region || 'Grand Est',
    value,
    deadline,
    publicationDate,
    source: 'ALSACE',
    sourceRef: `ALSACE-${id}`,
    procedureType,
    cpvCode,
    cpvLabel: null,
    lots: item.alloti ? 2 : 1,
    duration: null,
    status: 'OUVERT',
  };
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

/* ───── Fonction principale ───── */
export async function fetchAlsaceRecords(options?: {
  limit?: number;
}): Promise<AlsaceMarche[]> {
  const limit = options?.limit ?? 5000;
  const allRecords: AlsaceMarche[] = [];
  const maxPages = Math.ceil(limit / PAGE_SIZE);
  let consecutiveErrors = 0;

  console.log(`[ALSACE] Fetching up to ${limit} records via API...`);

  for (let page = 1; page <= maxPages && allRecords.length < limit; page++) {
    if (page > 1) {
      await new Promise((r) => setTimeout(r, 1500));
    }

    const url = `${API_URL}?itemsPerPage=${PAGE_SIZE}&page=${page}`;

    const res = await fetchWithRetry(url, {
      headers: {
        'User-Agent': UA,
        Accept: 'application/ld+json',
      },
    });

    if (!res) {
      console.warn(`[ALSACE] Page ${page} failed (500), skipping`);
      consecutiveErrors++;
      if (consecutiveErrors >= 5) {
        console.log(`[ALSACE] Too many consecutive errors, stopping`);
        break;
      }
      continue;
    }

    consecutiveErrors = 0;

    const data = await res.json();
    const members = data['hydra:member'] || [];
    const total = data['hydra:totalItems'] || 0;

    if (page === 1) {
      const totalPages = Math.ceil(total / PAGE_SIZE);
      console.log(`[ALSACE] ${total} consultations disponibles (${totalPages} pages)`);
    }

    if (members.length === 0) {
      console.log(`[ALSACE] No results on page ${page}, stopping`);
      break;
    }

    for (const item of members) {
      const record = mapRecord(item);
      if (record) {
        allRecords.push(record);
      }
    }

    console.log(`[ALSACE] Page ${page}: ${members.length} items (total mapped: ${allRecords.length})`);
  }

  // Deduplicate by sourceRef
  const seen = new Set<string>();
  const unique = allRecords.filter((r) => {
    if (seen.has(r.sourceRef)) return false;
    seen.add(r.sourceRef);
    return true;
  });

  console.log(`[ALSACE] Total records mapped: ${unique.length}`);
  return unique.slice(0, limit);
}
