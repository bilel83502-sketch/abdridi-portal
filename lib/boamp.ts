/**
 * BOAMP API Client — Récupère les appels d'offres publics depuis l'API BOAMP
 * Documentation : https://boamp-datadila.opendatasoft.com
 */

const BOAMP_API =
  'https://boamp-datadila.opendatasoft.com/api/explore/v2.1/catalog/datasets/boamp/records';

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

/* ───── Mapping nature BOAMP → nature interne ───── */
function mapNature(typeMarche: string[]): string {
  const t = (typeMarche?.[0] || '').toUpperCase();
  if (t === 'TRAVAUX') return 'TRAVAUX';
  if (t === 'FOURNITURES') return 'FOURNITURES';
  if (t === 'SERVICES') return 'SERVICES';
  return 'SERVICES'; // fallback
}

/* ───── Extraction CPV depuis le champ donnees ───── */
function extractCpv(donnees: any): { code: string | null; label: string | null } {
  if (!donnees) return { code: null, label: null };

  try {
    const d = typeof donnees === 'string' ? JSON.parse(donnees) : donnees;

    // eForms format (recent records)
    const eforms = d?.EFORMS?.ContractNotice;
    if (eforms) {
      const cpvNode =
        eforms?.['cac:ProcurementProject']?.['cac:MainCommodityClassification']?.[
          'cbc:ItemClassificationCode'
        ];
      const code = typeof cpvNode === 'object' ? cpvNode?.['#text'] : cpvNode;
      return { code: code || null, label: null };
    }

    // Legacy format
    const cpvObj = d?.OBJET?.CPV;
    if (cpvObj) {
      const code = Array.isArray(cpvObj)
        ? cpvObj[0]?.PRINCIPAL
        : cpvObj?.PRINCIPAL;
      return { code: code || null, label: null };
    }
  } catch {
    // ignore parse errors
  }

  return { code: null, label: null };
}

/* ───── Extraction du montant estimé ───── */
function extractValue(donnees: any): number | null {
  if (!donnees) return null;

  try {
    const d = typeof donnees === 'string' ? JSON.parse(donnees) : donnees;
    const eforms = d?.EFORMS?.ContractNotice;
    if (eforms) {
      // Try to find EstimatedOverallContractAmount in lots
      const lots = eforms?.['cac:ProcurementProjectLot'];
      const lotArr = Array.isArray(lots) ? lots : lots ? [lots] : [];
      for (const lot of lotArr) {
        const amount =
          lot?.['cac:ProcurementProject']?.['cac:RequestedTenderTotal']?.[
            'cbc:EstimatedOverallContractAmount'
          ];
        if (amount) {
          const v = typeof amount === 'object' ? amount?.['#text'] : amount;
          const parsed = parseFloat(v);
          if (!isNaN(parsed)) return parsed;
        }
      }
    }
  } catch {
    // ignore
  }

  return null;
}

/* ───── Extraction nombre de lots ───── */
function extractLots(donnees: any): number {
  if (!donnees) return 1;

  try {
    const d = typeof donnees === 'string' ? JSON.parse(donnees) : donnees;
    const eforms = d?.EFORMS?.ContractNotice;
    if (eforms) {
      const lots = eforms?.['cac:ProcurementProjectLot'];
      if (Array.isArray(lots)) return lots.length;
      if (lots) return 1;
    }

    // Legacy
    if (d?.OBJET?.DIV_EN_LOTS?.OUI) {
      const legacyLots = d?.LOTS?.LOT;
      if (Array.isArray(legacyLots)) return legacyLots.length;
    }
  } catch {
    // ignore
  }

  return 1;
}

/* ───── Extraction durée ───── */
function extractDuration(donnees: any): string | null {
  if (!donnees) return null;

  try {
    const d = typeof donnees === 'string' ? JSON.parse(donnees) : donnees;
    const eforms = d?.EFORMS?.ContractNotice;
    if (eforms) {
      const lots = eforms?.['cac:ProcurementProjectLot'];
      const lotArr = Array.isArray(lots) ? lots : lots ? [lots] : [];
      for (const lot of lotArr) {
        const dur = lot?.['cac:ProcurementProject']?.['cac:PlannedPeriod']?.['cbc:DurationMeasure'];
        if (dur) {
          const val = typeof dur === 'object' ? dur['#text'] : dur;
          const unit = typeof dur === 'object' ? dur['@unitCode'] : null;
          if (val) {
            const unitLabel =
              unit === 'YEAR' ? 'an(s)' : unit === 'MONTH' ? 'mois' : unit === 'DAY' ? 'jours' : 'mois';
            return `${val} ${unitLabel}`;
          }
        }
      }
    }
  } catch {
    // ignore
  }

  return null;
}

/* ───── Type retour pour le mapping ───── */
export interface BoampMarche {
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

/* ───── Mapper un record BOAMP vers notre modèle ───── */
function mapRecord(r: any): BoampMarche | null {
  const idweb = r.idweb;
  const objet = r.objet;
  const buyer = r.nomacheteur;

  if (!idweb || !objet || !buyer) return null;

  const dept = (r.code_departement_prestation || r.code_departement?.[0] || '00').toString();
  const deptInfo = DEPT_MAP[dept];
  const cpv = extractCpv(r.donnees);

  return {
    title: objet.slice(0, 500),
    buyer,
    nature: mapNature(r.type_marche),
    department: dept,
    departmentName: deptInfo?.name || null,
    region: deptInfo?.region || null,
    value: extractValue(r.donnees),
    deadline: r.datelimitereponse ? new Date(r.datelimitereponse) : null,
    publicationDate: r.dateparution ? new Date(r.dateparution + 'T00:00:00Z') : null,
    source: 'BOAMP',
    sourceRef: `BOAMP-${idweb}`,
    procedureType: r.procedure_libelle || null,
    cpvCode: cpv.code,
    cpvLabel: r.descripteur_libelle?.join(', ') || cpv.label,
    lots: extractLots(r.donnees),
    duration: extractDuration(r.donnees),
    status: 'OUVERT',
  };
}

/* ───── Fonction principale : récupérer les annonces BOAMP ───── */
export async function fetchBoampRecords(options?: {
  limit?: number;
  daysBack?: number;
}): Promise<BoampMarche[]> {
  const limit = options?.limit ?? 100;
  const daysBack = options?.daysBack ?? 30;

  const since = new Date();
  since.setDate(since.getDate() - daysBack);
  const sinceStr = since.toISOString().split('T')[0];

  const allRecords: BoampMarche[] = [];
  let offset = 0;
  const pageSize = 100; // max per page on OpenDataSoft

  while (allRecords.length < limit) {
    const remaining = limit - allRecords.length;
    const take = Math.min(remaining, pageSize);

    const params = new URLSearchParams({
      limit: take.toString(),
      offset: offset.toString(),
      order_by: 'dateparution desc',
      where: `dateparution>='${sinceStr}' AND nature='APPEL_OFFRE'`,
    });

    const url = `${BOAMP_API}?${params}`;
    console.log(`[BOAMP] Fetching offset=${offset}, limit=${take}...`);

    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`BOAMP API error ${res.status}: ${body}`);
    }

    const json = await res.json();
    const results = json.results || [];

    if (results.length === 0) break;

    for (const r of results) {
      const mapped = mapRecord(r);
      if (mapped) allRecords.push(mapped);
    }

    offset += results.length;

    // No more data available
    if (results.length < take) break;
  }

  console.log(`[BOAMP] Total records mapped: ${allRecords.length}`);
  return allRecords;
}
