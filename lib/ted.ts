/**
 * TED API Client — Récupère les appels d'offres européens depuis l'API TED
 * Documentation : https://docs.ted.europa.eu/api/latest/index.html
 * Endpoint : POST https://api.ted.europa.eu/v3/notices/search
 * Pas de clé API requise pour les notices publiées
 */

const TED_API = 'https://api.ted.europa.eu/v3/notices/search';

/* ───── Mapping NUTS FR → département ───── */
const NUTS_TO_DEPT: Record<string, { dept: string; name: string; region: string }> = {
  FR10: { dept: '75', name: 'Paris', region: 'Île-de-France' },
  FR101: { dept: '75', name: 'Paris', region: 'Île-de-France' },
  FR102: { dept: '92', name: 'Hauts-de-Seine', region: 'Île-de-France' },
  FR103: { dept: '93', name: 'Seine-Saint-Denis', region: 'Île-de-France' },
  FR104: { dept: '94', name: 'Val-de-Marne', region: 'Île-de-France' },
  FR105: { dept: '77', name: 'Seine-et-Marne', region: 'Île-de-France' },
  FR106: { dept: '78', name: 'Yvelines', region: 'Île-de-France' },
  FR107: { dept: '91', name: 'Essonne', region: 'Île-de-France' },
  FR108: { dept: '95', name: "Val-d'Oise", region: 'Île-de-France' },
  FRB: { dept: '45', name: 'Loiret', region: 'Centre-Val de Loire' },
  FRC: { dept: '21', name: "Côte-d'Or", region: 'Bourgogne-Franche-Comté' },
  FRD: { dept: '14', name: 'Calvados', region: 'Normandie' },
  FRE: { dept: '59', name: 'Nord', region: 'Hauts-de-France' },
  FRE11: { dept: '59', name: 'Nord', region: 'Hauts-de-France' },
  FRE12: { dept: '62', name: 'Pas-de-Calais', region: 'Hauts-de-France' },
  FRF: { dept: '67', name: 'Bas-Rhin', region: 'Grand Est' },
  FRF1: { dept: '67', name: 'Bas-Rhin', region: 'Grand Est' },
  FRF11: { dept: '67', name: 'Bas-Rhin', region: 'Grand Est' },
  FRF12: { dept: '68', name: 'Haut-Rhin', region: 'Grand Est' },
  FRG: { dept: '44', name: 'Loire-Atlantique', region: 'Pays de la Loire' },
  FRH: { dept: '35', name: 'Ille-et-Vilaine', region: 'Bretagne' },
  FRI: { dept: '33', name: 'Gironde', region: 'Nouvelle-Aquitaine' },
  FRJ: { dept: '31', name: 'Haute-Garonne', region: 'Occitanie' },
  FRJ1: { dept: '34', name: 'Hérault', region: 'Occitanie' },
  FRJ2: { dept: '31', name: 'Haute-Garonne', region: 'Occitanie' },
  FRK: { dept: '69', name: 'Rhône', region: 'Auvergne-Rhône-Alpes' },
  FRK1: { dept: '69', name: 'Rhône', region: 'Auvergne-Rhône-Alpes' },
  FRK2: { dept: '69', name: 'Rhône', region: 'Auvergne-Rhône-Alpes' },
  FRK24: { dept: '38', name: 'Isère', region: 'Auvergne-Rhône-Alpes' },
  FRL: { dept: '13', name: 'Bouches-du-Rhône', region: 'PACA' },
  FRL0: { dept: '13', name: 'Bouches-du-Rhône', region: 'PACA' },
  FRL04: { dept: '06', name: 'Alpes-Maritimes', region: 'PACA' },
  FRM: { dept: '20', name: 'Corse', region: 'Corse' },
  FRY: { dept: '97', name: 'Outre-Mer', region: 'Outre-Mer' },
  FRY1: { dept: '971', name: 'Guadeloupe', region: 'Outre-Mer' },
  FRY10: { dept: '971', name: 'Guadeloupe', region: 'Outre-Mer' },
  FRY2: { dept: '972', name: 'Martinique', region: 'Outre-Mer' },
  FRY20: { dept: '972', name: 'Martinique', region: 'Outre-Mer' },
  FRY3: { dept: '973', name: 'Guyane', region: 'Outre-Mer' },
  FRY30: { dept: '973', name: 'Guyane', region: 'Outre-Mer' },
  FRY4: { dept: '974', name: 'La Réunion', region: 'Outre-Mer' },
  FRY40: { dept: '974', name: 'La Réunion', region: 'Outre-Mer' },
  FRY5: { dept: '976', name: 'Mayotte', region: 'Outre-Mer' },
  FRY50: { dept: '976', name: 'Mayotte', region: 'Outre-Mer' },
};

/* ───── Résoudre un code NUTS FR vers département ───── */
function resolveNuts(codes: string[]): {
  dept: string;
  name: string | null;
  region: string | null;
} {
  if (!codes || codes.length === 0) return { dept: '00', name: null, region: null };

  // Try NUTS codes from most specific to least
  for (const code of codes) {
    if (!code.startsWith('FR')) continue;
    // Try exact match, then progressively shorter prefixes
    for (let len = code.length; len >= 2; len--) {
      const prefix = code.substring(0, len);
      if (NUTS_TO_DEPT[prefix]) {
        return {
          dept: NUTS_TO_DEPT[prefix].dept,
          name: NUTS_TO_DEPT[prefix].name,
          region: NUTS_TO_DEPT[prefix].region,
        };
      }
    }
  }

  return { dept: '00', name: null, region: null };
}

/* ───── Mapping contract-nature TED → nature interne ───── */
function mapNature(contractNature: string[]): string {
  if (!contractNature || contractNature.length === 0) return 'SERVICES';
  const n = contractNature[0].toLowerCase();
  if (n === 'works') return 'TRAVAUX';
  if (n === 'supplies') return 'FOURNITURES';
  return 'SERVICES';
}

/* ───── Mapping procedure-type TED → libellé ───── */
function mapProcedure(procType: string | null): string | null {
  if (!procType) return null;
  const map: Record<string, string> = {
    open: 'Procédure Ouverte',
    restricted: 'Procédure Restreinte',
    'comp-dial': 'Dialogue Compétitif',
    'neg-wo-call': 'Procédure Négociée sans publication',
    'neg-w-call': 'Procédure Négociée avec publication',
    innovation: 'Partenariat d\'Innovation',
    oth: 'Autre procédure',
  };
  return map[procType] || procType;
}

/* ───── Extraire texte français depuis objet multilingue ───── */
function getFrText(obj: Record<string, string | string[]> | null): string | null {
  if (!obj) return null;
  const fra = obj.fra;
  if (Array.isArray(fra)) return fra[0] || null;
  if (typeof fra === 'string') return fra;
  // Fallback to English
  const eng = obj.eng;
  if (Array.isArray(eng)) return eng[0] || null;
  if (typeof eng === 'string') return eng;
  return null;
}

/* ───── Type retour pour le mapping ───── */
export interface TedMarche {
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

/* ───── Mapper un record TED vers notre modèle ───── */
function mapRecord(r: any): TedMarche | null {
  const pubNumber = r['publication-number'];
  if (!pubNumber) return null;

  // Title: prefer French title from notice-title or title-lot
  const noticeTitle = getFrText(r['notice-title']);
  const lotTitle = getFrText(r['title-lot']);
  const title = lotTitle || noticeTitle;
  if (!title) return null;

  // Buyer
  const buyerObj = r['buyer-name'];
  const buyer = getFrText(buyerObj);
  if (!buyer) return null;

  // Location from NUTS codes
  const nuts = r['place-of-performance'] || [];
  const location = resolveNuts(nuts);

  // Deadline
  let deadline: Date | null = null;
  const deadlineDates = r['deadline-receipt-tender-date-lot'];
  const deadlineTimes = r['deadline-receipt-tender-time-lot'];
  if (deadlineDates && deadlineDates.length > 0) {
    const dateStr = deadlineDates[0].split('+')[0]; // "2026-02-20"
    const timeStr = deadlineTimes?.[0]?.split('+')[0] || '12:00:00';
    deadline = new Date(`${dateStr}T${timeStr}Z`);
  }

  // Publication date
  let pubDate: Date | null = null;
  const pubDateStr = r['publication-date'];
  if (pubDateStr) {
    const dateOnly = pubDateStr.split('+')[0];
    pubDate = new Date(`${dateOnly}T00:00:00Z`);
  }

  // CPV codes
  const cpvCodes = r['classification-cpv'] || [];
  const cpvCode = cpvCodes.length > 0 ? cpvCodes[0] : null;

  // Estimated value
  let value: number | null = null;
  const estValues = r['estimated-value-lot'];
  if (estValues && estValues.length > 0) {
    const parsed = parseFloat(estValues[0]);
    if (!isNaN(parsed) && parsed > 0) value = parsed;
  }

  // Contract nature
  const contractNature = r['contract-nature'] || [];

  // Number of lots (count unique lot titles)
  const lotTitles = r['title-lot']?.fra;
  const lots = Array.isArray(lotTitles) ? lotTitles.length : 1;

  return {
    title: title.slice(0, 500),
    buyer,
    nature: mapNature(contractNature),
    department: location.dept,
    departmentName: location.name,
    region: location.region,
    value,
    deadline,
    publicationDate: pubDate,
    source: 'TED',
    sourceRef: `TED-${pubNumber}`,
    procedureType: mapProcedure(r['procedure-type']),
    cpvCode,
    cpvLabel: null,
    lots,
    duration: null,
    status: 'OUVERT',
  };
}

/* ───── Fonction principale : récupérer les avis TED ───── */
export async function fetchTedRecords(options?: {
  limit?: number;
  daysBack?: number;
}): Promise<TedMarche[]> {
  const limit = options?.limit ?? 5000;
  const daysBack = options?.daysBack ?? 90;

  const since = new Date();
  since.setDate(since.getDate() - daysBack);
  const sinceStr = since.toISOString().split('T')[0].replace(/-/g, '');

  const allRecords: TedMarche[] = [];
  let page = 1;
  const pageSize = 100; // TED max is 250, use 100 for safety

  while (allRecords.length < limit) {
    const remaining = limit - allRecords.length;
    const take = Math.min(remaining, pageSize);

    const body = {
      query: `buyer-country = FRA AND notice-type = cn-standard AND publication-date >= ${sinceStr}`,
      fields: [
        'publication-number',
        'notice-title',
        'buyer-name',
        'contract-nature',
        'place-of-performance',
        'classification-cpv',
        'publication-date',
        'deadline-receipt-tender-date-lot',
        'deadline-receipt-tender-time-lot',
        'procedure-type',
        'estimated-value-lot',
        'estimated-value-cur-lot',
        'title-lot',
      ],
      limit: take,
      page,
    };

    console.log(`[TED] Fetching page=${page}, limit=${take}...`);

    const res = await fetch(TED_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ABDridi-Portal/1.0',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`TED API error ${res.status}: ${text.slice(0, 500)}`);
    }

    const json = await res.json();
    const notices = json.notices || [];

    if (notices.length === 0) break;

    for (const r of notices) {
      const mapped = mapRecord(r);
      if (mapped) allRecords.push(mapped);
    }

    page++;

    // No more data available
    if (notices.length < take) break;

    // TED API max is 15000 notices via pagination
    if (page * pageSize > 15000) break;
  }

  console.log(`[TED] Total records mapped: ${allRecords.length}`);
  return allRecords;
}
