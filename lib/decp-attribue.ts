/**
 * Client API pour les marchés ATTRIBUÉS — 2 sources :
 * 1. DECP V3 : https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/decp-v3-marches-valides/records
 *    - 700K+ marchés validés, mais titulaire_id_1 est un SIRET (pas de nom)
 * 2. BOAMP Attribution : nature='ATTRIBUTION' sur l'API BOAMP
 *    - 447K+ avis d'attribution avec titulaire en nom clair
 *    - Source principale pour la veille concurrentielle
 */

const DECP_V3_API =
  'https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/decp-v3-marches-valides/records';

const BOAMP_API =
  'https://boamp-datadila.opendatasoft.com/api/explore/v2.1/catalog/datasets/boamp/records';

// ── Mapping départements ──────────────────────────────────────────
const DEPT_MAP: Record<string, { name: string; region: string }> = {
  '01': { name: 'Ain', region: 'Auvergne-Rhône-Alpes' },
  '02': { name: 'Aisne', region: 'Hauts-de-France' },
  '03': { name: 'Allier', region: 'Auvergne-Rhône-Alpes' },
  '04': { name: 'Alpes-de-Haute-Provence', region: "Provence-Alpes-Côte d'Azur" },
  '05': { name: 'Hautes-Alpes', region: "Provence-Alpes-Côte d'Azur" },
  '06': { name: 'Alpes-Maritimes', region: "Provence-Alpes-Côte d'Azur" },
  '07': { name: 'Ardèche', region: 'Auvergne-Rhône-Alpes' },
  '08': { name: 'Ardennes', region: 'Grand Est' },
  '09': { name: 'Ariège', region: 'Occitanie' },
  '10': { name: 'Aube', region: 'Grand Est' },
  '11': { name: 'Aude', region: 'Occitanie' },
  '12': { name: 'Aveyron', region: 'Occitanie' },
  '13': { name: 'Bouches-du-Rhône', region: "Provence-Alpes-Côte d'Azur" },
  '14': { name: 'Calvados', region: 'Normandie' },
  '15': { name: 'Cantal', region: 'Auvergne-Rhône-Alpes' },
  '16': { name: 'Charente', region: 'Nouvelle-Aquitaine' },
  '17': { name: 'Charente-Maritime', region: 'Nouvelle-Aquitaine' },
  '18': { name: 'Cher', region: 'Centre-Val de Loire' },
  '19': { name: 'Corrèze', region: 'Nouvelle-Aquitaine' },
  '2A': { name: 'Corse-du-Sud', region: 'Corse' },
  '2B': { name: 'Haute-Corse', region: 'Corse' },
  '21': { name: "Côte-d'Or", region: 'Bourgogne-Franche-Comté' },
  '22': { name: "Côtes-d'Armor", region: 'Bretagne' },
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
  '83': { name: 'Var', region: "Provence-Alpes-Côte d'Azur" },
  '84': { name: 'Vaucluse', region: "Provence-Alpes-Côte d'Azur" },
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
  '971': { name: 'Guadeloupe', region: 'Guadeloupe' },
  '972': { name: 'Martinique', region: 'Martinique' },
  '973': { name: 'Guyane', region: 'Guyane' },
  '974': { name: 'La Réunion', region: 'La Réunion' },
  '976': { name: 'Mayotte', region: 'Mayotte' },
};

// ── Type de sortie ────────────────────────────────────────────────
export interface AttribueRecord {
  objet: string;
  acheteurNom: string;
  acheteurSiret: string | null;
  titulaireNom: string;
  titulaireSiret: string | null;
  titulaireCommune: string | null;
  montant: number | null;
  dateNotification: Date | null;
  datePublicationDonnees: Date | null;
  nature: string;
  procedure: string | null;
  lieuExecution: string | null;
  departement: string | null;
  departementNom: string | null;
  region: string | null;
  codeCPV: string | null;
  labelCPV: string | null;
  source: string;
  sourceRef: string;
  dureeMois: number | null;
  formePrix: string | null;
}

// ── Mapping nature ────────────────────────────────────────────────
function mapNatureFromText(raw: string | null | undefined): string {
  if (!raw) return 'SERVICES';
  const lower = raw.toLowerCase();
  if (lower.includes('travaux')) return 'TRAVAUX';
  if (lower.includes('fourniture')) return 'FOURNITURES';
  return 'SERVICES';
}

function mapNatureFromArray(arr: string[] | null | undefined): string {
  const t = (arr?.[0] || '').toUpperCase();
  if (t === 'TRAVAUX') return 'TRAVAUX';
  if (t === 'FOURNITURES') return 'FOURNITURES';
  if (t === 'SERVICES') return 'SERVICES';
  return 'SERVICES';
}

// ── Extract département from lieu/code ────────────────────────────
function extractDepartement(code: string | null): string | null {
  if (!code) return null;
  const s = code.toString().trim();
  // Code postal → 2 premiers chiffres (ou 3 pour DOM-TOM)
  if (s.length === 5) {
    const d = s.startsWith('97') ? s.slice(0, 3) : s.slice(0, 2);
    return DEPT_MAP[d] ? d : null;
  }
  // Code département direct
  if (DEPT_MAP[s]) return s;
  // Code région → null (pas assez précis)
  return null;
}

// =====================================================================
//  SOURCE 1 : DECP V3 (decp-v3-marches-valides)
// =====================================================================

function mapDecpV3Record(r: any): AttribueRecord | null {
  const id = r.id;
  if (!id) return null;

  // Titulaire : SIRET numérique seulement dans V3 (pas de nom)
  const titulaireSiret = r.titulaire_id_1
    ? String(r.titulaire_id_1).padStart(14, '0')
    : null;
  // Nom du titulaire 2 est parfois le nom du titulaire 1 dans la V3
  const titulaireNom =
    r.titulaire_denominationsociale_2 ||
    (titulaireSiret ? `SIRET ${titulaireSiret}` : null);

  if (!titulaireNom) return null;

  const dept = extractDepartement(r.lieuexecution_code);
  const deptInfo = dept ? DEPT_MAP[dept] : null;

  return {
    objet: r.objet || 'Sans objet',
    acheteurNom: r.acheteur_nom || r.acheteur_id || 'Non renseigné',
    acheteurSiret: r.acheteur_id || null,
    titulaireNom,
    titulaireSiret: titulaireSiret,
    titulaireCommune: null,
    montant: r.montant ? parseFloat(String(r.montant)) : null,
    dateNotification: r.datenotification ? new Date(r.datenotification) : null,
    datePublicationDonnees: r.datepublicationdonnees
      ? new Date(r.datepublicationdonnees)
      : null,
    nature: mapNatureFromText(r.nature),
    procedure: r.procedure || null,
    lieuExecution: r.lieuexecution_nom || null,
    departement: dept,
    departementNom: deptInfo?.name || null,
    region: deptInfo?.region || null,
    codeCPV: r.codecpv ? r.codecpv.split('-')[0] : null,
    labelCPV: null,
    source: `DECP-${r.source || 'V3'}`,
    sourceRef: `DECP-V3-${id}`.slice(0, 250),
    dureeMois: r.dureemois ? parseInt(String(r.dureemois)) : null,
    formePrix: r.formeprix || null,
  };
}

export async function fetchDecpV3Records(options?: {
  limit?: number;
  monthsBack?: number;
}): Promise<AttribueRecord[]> {
  const limit = options?.limit ?? 5000;
  const monthsBack = options?.monthsBack ?? 12;

  const since = new Date();
  since.setMonth(since.getMonth() - monthsBack);
  const sinceStr = since.toISOString().split('T')[0];

  const allRecords: AttribueRecord[] = [];
  const seenRefs = new Set<string>();
  let offset = 0;
  const pageSize = 100;

  while (allRecords.length < limit) {
    const remaining = limit - allRecords.length;
    const take = Math.min(remaining, pageSize);

    const params = new URLSearchParams({
      limit: take.toString(),
      offset: offset.toString(),
      order_by: 'datenotification desc',
      where: `datenotification>='${sinceStr}'`,
    });

    const url = `${DECP_V3_API}?${params}`;
    console.log(`[DECP-V3] Fetching offset=${offset}, limit=${take}...`);

    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) {
      const body = await res.text();
      console.error(`[DECP-V3] API error ${res.status}: ${body.slice(0, 200)}`);
      break;
    }

    const json = await res.json();
    const results = json.results || [];
    if (results.length === 0) break;

    for (const r of results) {
      const mapped = mapDecpV3Record(r);
      if (mapped && !seenRefs.has(mapped.sourceRef)) {
        seenRefs.add(mapped.sourceRef);
        allRecords.push(mapped);
      }
    }

    offset += results.length;
    if (results.length < take) break;
  }

  console.log(`[DECP-V3] Total records mapped: ${allRecords.length}`);
  return allRecords;
}

// =====================================================================
//  SOURCE 2 : BOAMP Attribution (nature='ATTRIBUTION')
// =====================================================================

function mapBoampAttribRecord(r: any): AttribueRecord | null {
  const idweb = r.idweb;
  const objet = r.objet;
  const buyer = r.nomacheteur;
  const titulaires = r.titulaire; // Array of strings: ["SMAC SAS"]

  if (!idweb || !objet) return null;

  const titulaireNom = Array.isArray(titulaires)
    ? titulaires[0] || null
    : titulaires || null;
  if (!titulaireNom) return null;

  const deptCodes = r.code_departement || [];
  const dept = r.code_departement_prestation
    || (Array.isArray(deptCodes) ? deptCodes[0] : deptCodes)
    || null;
  const deptStr = dept ? dept.toString() : null;
  const deptInfo = deptStr ? DEPT_MAP[deptStr] : null;

  return {
    objet: objet.slice(0, 500),
    acheteurNom: buyer || 'Non renseigné',
    acheteurSiret: null,
    titulaireNom,
    titulaireSiret: null,
    titulaireCommune: null,
    montant: null, // BOAMP attribution doesn't always have amount
    dateNotification: r.dateparution
      ? new Date(r.dateparution + 'T00:00:00Z')
      : null,
    datePublicationDonnees: r.dateparution
      ? new Date(r.dateparution + 'T00:00:00Z')
      : null,
    nature: mapNatureFromArray(r.type_marche),
    procedure: r.procedure_libelle || null,
    lieuExecution: null,
    departement: deptStr,
    departementNom: deptInfo?.name || null,
    region: deptInfo?.region || null,
    codeCPV: null,
    labelCPV: r.descripteur_libelle?.join(', ') || null,
    source: 'BOAMP',
    sourceRef: `BOAMP-ATT-${idweb}`,
    dureeMois: null,
    formePrix: null,
  };
}

export async function fetchBoampAttribRecords(options?: {
  limit?: number;
  daysBack?: number;
}): Promise<AttribueRecord[]> {
  const limit = options?.limit ?? 5000;
  const daysBack = options?.daysBack ?? 365; // 12 mois

  const since = new Date();
  since.setDate(since.getDate() - daysBack);
  const sinceStr = since.toISOString().split('T')[0];

  const allRecords: AttribueRecord[] = [];
  const seenRefs = new Set<string>();
  let offset = 0;
  const pageSize = 100;

  while (allRecords.length < limit) {
    const remaining = limit - allRecords.length;
    const take = Math.min(remaining, pageSize);

    const params = new URLSearchParams({
      limit: take.toString(),
      offset: offset.toString(),
      order_by: 'dateparution desc',
      where: `dateparution>='${sinceStr}' AND nature='ATTRIBUTION'`,
    });

    const url = `${BOAMP_API}?${params}`;
    console.log(`[BOAMP-ATT] Fetching offset=${offset}, limit=${take}...`);

    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) {
      const body = await res.text();
      console.error(`[BOAMP-ATT] API error ${res.status}: ${body.slice(0, 200)}`);
      break;
    }

    const json = await res.json();
    const results = json.results || [];
    if (results.length === 0) break;

    for (const r of results) {
      const mapped = mapBoampAttribRecord(r);
      if (mapped && !seenRefs.has(mapped.sourceRef)) {
        seenRefs.add(mapped.sourceRef);
        allRecords.push(mapped);
      }
    }

    offset += results.length;
    if (results.length < take) break;
  }

  console.log(`[BOAMP-ATT] Total records mapped: ${allRecords.length}`);
  return allRecords;
}

// =====================================================================
//  COMBINED : Fetch from both sources with deduplication
// =====================================================================
export async function fetchAllAttribueRecords(options?: {
  limitPerSource?: number;
  monthsBack?: number;
}): Promise<AttribueRecord[]> {
  const limitPerSource = options?.limitPerSource ?? 5000;
  const monthsBack = options?.monthsBack ?? 12;
  const daysBack = monthsBack * 30;

  console.log(`\n[SYNC] Starting combined attribution sync (${monthsBack} months, max ${limitPerSource}/source)...\n`);

  // Fetch both in parallel
  const [decpRecords, boampRecords] = await Promise.all([
    fetchDecpV3Records({ limit: limitPerSource, monthsBack }),
    fetchBoampAttribRecords({ limit: limitPerSource, daysBack }),
  ]);

  // Merge with deduplication by sourceRef
  const allRecords: AttribueRecord[] = [];
  const seenRefs = new Set<string>();

  // BOAMP first (better quality: has titulaire name)
  for (const r of boampRecords) {
    if (!seenRefs.has(r.sourceRef)) {
      seenRefs.add(r.sourceRef);
      allRecords.push(r);
    }
  }

  // Then DECP V3
  for (const r of decpRecords) {
    if (!seenRefs.has(r.sourceRef)) {
      seenRefs.add(r.sourceRef);
      allRecords.push(r);
    }
  }

  console.log(`\n[SYNC] Combined: ${allRecords.length} unique records (BOAMP: ${boampRecords.length}, DECP-V3: ${decpRecords.length})\n`);
  return allRecords;
}
