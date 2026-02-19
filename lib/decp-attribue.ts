/**
 * Client API DECP pour les marchés ATTRIBUÉS
 * Source : https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/decp_augmente/records
 * Données Essentielles de la Commande Publique — marchés déjà notifiés/attribués
 */

const DECP_API =
  'https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/decp_augmente/records';

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

// ── Mapping nature ────────────────────────────────────────────────
function mapNature(raw: string | null): string {
  if (!raw) return 'SERVICES';
  const lower = raw.toLowerCase();
  if (lower.includes('travaux')) return 'TRAVAUX';
  if (lower.includes('fourniture')) return 'FOURNITURES';
  return 'SERVICES';
}

// ── Type de sortie ────────────────────────────────────────────────
export interface DecpAttribue {
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

// ── Mapper un record DECP ─────────────────────────────────────────
function mapRecord(r: any): DecpAttribue | null {
  const id = r.id;
  const sourcePlatform = r.source || 'DECP';
  const titulaireNom =
    r.denominationsocialeetablissement ||
    r.denominationunitelegale ||
    '';

  if (!id || !titulaireNom) return null;

  const dept = r.codedepartementexecution || null;
  const deptInfo = dept ? DEPT_MAP[dept] : null;

  const sourceRef = `DECP-A-${id}-${sourcePlatform}`.slice(0, 250);

  return {
    objet: r.objetmarche || 'Sans objet',
    acheteurNom: r.nomacheteur || 'Non renseigné',
    acheteurSiret: r.idacheteur || null,
    titulaireNom,
    titulaireSiret: r.siretetablissement || null,
    titulaireCommune: r.communeetablissement || null,
    montant: r.montant ? parseFloat(String(r.montant)) : null,
    dateNotification: r.datenotification ? new Date(r.datenotification) : null,
    datePublicationDonnees: r.datepublicationdonnees
      ? new Date(r.datepublicationdonnees)
      : null,
    nature: mapNature(r.natureobjetmarche),
    procedure: r.procedure || null,
    lieuExecution: r.lieuexecutionnom || null,
    departement: dept,
    departementNom: deptInfo?.name || null,
    region: deptInfo?.region || null,
    codeCPV: r.codecpv ? r.codecpv.split('-')[0] : null,
    labelCPV: r.referencecpv || null,
    source: sourcePlatform,
    sourceRef,
    dureeMois: r.dureemois ? parseInt(String(r.dureemois)) : null,
    formePrix: r.formeprix || null,
  };
}

// ── Fetcher paginé ────────────────────────────────────────────────
export async function fetchDecpAttribueRecords(options?: {
  limit?: number;
  monthsBack?: number;
}): Promise<DecpAttribue[]> {
  const limit = options?.limit ?? 500;
  const monthsBack = options?.monthsBack ?? 36;

  const since = new Date();
  since.setMonth(since.getMonth() - monthsBack);
  const sinceStr = since.toISOString().split('T')[0];

  const allRecords: DecpAttribue[] = [];
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

    const url = `${DECP_API}?${params}`;
    console.log(`[DECP-Attribué] Fetching offset=${offset}, limit=${take}...`);

    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`DECP API error ${res.status}: ${body}`);
    }

    const json = await res.json();
    const results = json.results || [];

    if (results.length === 0) break;

    for (const r of results) {
      const mapped = mapRecord(r);
      if (mapped && !seenRefs.has(mapped.sourceRef)) {
        seenRefs.add(mapped.sourceRef);
        allRecords.push(mapped);
      }
    }

    offset += results.length;
    if (results.length < take) break;
  }

  console.log(`[DECP-Attribué] Total records mapped: ${allRecords.length}`);
  return allRecords;
}
