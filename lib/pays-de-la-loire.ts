/**
 * Pays de la Loire — Marchés publics de la région Pays de la Loire
 * https://www.proaachats.fr
 *
 * Méthode : API REST JSON-LD publique /api/v2/consultations
 * Plateforme ATEXO (même que Mégalis/Maximilien).
 * Pagination avec itemsPerPage=2 (seule valeur acceptée par le serveur).
 * TODO: Vérifier l'URL exacte de la plateforme (proaachats.fr ou marches.paysdelaloire.fr)
 */

const BASE_URL = 'https://www.proaachats.fr';
const API_URL = `${BASE_URL}/api/v2/consultations`;
const PAGE_SIZE = 2;
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

/* ───── Mapping département → nom + région ───── */
const DEPT_MAP: Record<string, { name: string; region: string }> = {
  '44': { name: 'Loire-Atlantique', region: 'Pays de la Loire' },
  '49': { name: 'Maine-et-Loire', region: 'Pays de la Loire' },
  '53': { name: 'Mayenne', region: 'Pays de la Loire' },
  '72': { name: 'Sarthe', region: 'Pays de la Loire' },
  '85': { name: 'Vendée', region: 'Pays de la Loire' },
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
export interface PDLMarche {
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
function mapRecord(item: any): PDLMarche | null {
  const id = item.id;
  if (!id) return null;

  const title = (item.intitule || item.objet || '').trim();
  if (!title) return null;

  if (title.toUpperCase().includes('NE PAS UTILISER') || title.toUpperCase().includes('CONSULTATION TECHNIQUE TEST')) {
    return null;
  }

  const buyer = (item.organismeDenomination || 'Région Pays de la Loire').trim();
  const nature = mapNature(item.naturePrestationLibelle || 'Services');
  const procedureType = item.typeProcedureLibelle || null;
  const cpvCode = item.codeCpvPrincipal || null;

  const lieux: string[] = item.lieuxExecution || [];
  const dept = lieux.find((l: string) => /^\d{2,3}$/.test(l) || /^2[AB]$/.test(l)) || '44';
  const deptInfo = DEPT_MAP[dept];

  const deadline = item.dateLimiteRemisePlis ? new Date(item.dateLimiteRemisePlis) : null;
  const publicationDate = item.dateMiseEnLigneCalcule ? new Date(item.dateMiseEnLigneCalcule) : null;

  const value = typeof item.valeurEstimee === 'number' && item.valeurEstimee > 0
    ? item.valeurEstimee
    : null;

  const reference = item.reference || '';

  return {
    title: reference ? `${reference} — ${title}`.slice(0, 500) : title.slice(0, 500),
    buyer: buyer.slice(0, 300),
    nature,
    department: dept,
    departmentName: deptInfo?.name || null,
    region: deptInfo?.region || 'Pays de la Loire',
    value,
    deadline,
    publicationDate,
    source: 'PDL',
    sourceRef: `PDL-${id}`,
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
export async function fetchPDLRecords(options?: {
  limit?: number;
}): Promise<PDLMarche[]> {
  const limit = options?.limit ?? 5000;
  const allRecords: PDLMarche[] = [];
  const maxPages = Math.ceil(limit / PAGE_SIZE);
  let consecutiveErrors = 0;

  console.log(`[PDL] Fetching up to ${limit} records via API...`);

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
      console.warn(`[PDL] Page ${page} failed (500), skipping`);
      consecutiveErrors++;
      if (consecutiveErrors >= 5) {
        console.log(`[PDL] Too many consecutive errors, stopping`);
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
      console.log(`[PDL] ${total} consultations disponibles (${totalPages} pages)`);
    }

    if (members.length === 0) {
      console.log(`[PDL] No results on page ${page}, stopping`);
      break;
    }

    for (const item of members) {
      const record = mapRecord(item);
      if (record) {
        allRecords.push(record);
      }
    }

    console.log(`[PDL] Page ${page}: ${members.length} items (total mapped: ${allRecords.length})`);
  }

  const seen = new Set<string>();
  const unique = allRecords.filter((r) => {
    if (seen.has(r.sourceRef)) return false;
    seen.add(r.sourceRef);
    return true;
  });

  console.log(`[PDL] Total records mapped: ${unique.length}`);
  return unique.slice(0, limit);
}
