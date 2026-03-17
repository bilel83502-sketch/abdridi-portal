/**
 * Scraper Open Data Bordeaux Métropole — marchés publics attribués
 * API : https://opendata.bordeaux-metropole.fr
 * Dataset : met_marches_publics_2024 (format DECP, données depuis 2024)
 * Fallback : met_marches_publics_2019 (données 2018-2024)
 */

import { type AttribueRecord } from './decp-attribue';

const BORDEAUX_API_2024 =
  'https://opendata.bordeaux-metropole.fr/api/explore/v2.1/catalog/datasets/met_marches_publics_2024/records';

const BORDEAUX_API_2019 =
  'https://opendata.bordeaux-metropole.fr/api/explore/v2.1/catalog/datasets/met_marches_publics_2019/records';

function mapNature(raw: string | null | undefined): string {
  if (!raw) return 'SERVICES';
  const lower = raw.toLowerCase();
  if (lower.includes('travaux')) return 'TRAVAUX';
  if (lower.includes('fourniture')) return 'FOURNITURES';
  return 'SERVICES';
}

function mapRecord(r: any): AttribueRecord | null {
  const id = r.id || r.uid;
  if (!id) return null;

  const objet = r.objet || '';
  const titulaireNom =
    r.titulaires_denominationsociale || r.titulaire || null;
  if (!objet && !titulaireNom) return null;

  const titulaireSiret = r.titulaires_id || null;
  const dept = r.lieuexecution_code
    ? String(r.lieuexecution_code).slice(0, 2)
    : '33';

  return {
    objet: (objet || 'Marché Bordeaux Métropole').slice(0, 500),
    acheteurNom: r.acheteur_nom || r.acheteur_raison_sociale || 'Bordeaux Métropole',
    acheteurSiret: r.acheteur_id || null,
    titulaireNom: titulaireNom || 'Non renseigné',
    titulaireSiret: titulaireSiret,
    titulaireCommune: null,
    montant: r.montant ? parseFloat(String(r.montant)) : null,
    dateNotification: r.datenotification
      ? new Date(r.datenotification)
      : null,
    datePublicationDonnees: r.datepublicationdonnees
      ? new Date(r.datepublicationdonnees)
      : null,
    nature: mapNature(r.nature),
    procedure: r.procedure || null,
    lieuExecution: r.lieuexecution_nom || 'Bordeaux Métropole',
    departement: dept,
    departementNom: dept === '33' ? 'Gironde' : null,
    region: 'Nouvelle-Aquitaine',
    codeCPV: r.codecpv || null,
    labelCPV: null,
    source: 'BORDEAUX',
    sourceRef: `BORDEAUX-${id}`.slice(0, 250),
    dureeMois: r.dureemois ? parseInt(String(r.dureemois)) : null,
    formePrix: r.formeprix || null,
  };
}

async function fetchFromEndpoint(
  apiUrl: string,
  label: string,
  options: { limit: number; startOffset: number }
): Promise<AttribueRecord[]> {
  const { limit, startOffset } = options;
  const allRecords: AttribueRecord[] = [];
  const seenRefs = new Set<string>();
  let offset = startOffset;
  const pageSize = 100;

  while (allRecords.length < limit) {
    const remaining = limit - allRecords.length;
    const take = Math.min(remaining, pageSize);

    const params = new URLSearchParams({
      limit: take.toString(),
      offset: offset.toString(),
      order_by: 'datenotification desc',
    });

    const url = `${apiUrl}?${params}`;
    console.log(`[BORDEAUX] ${label} offset=${offset}...`);

    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) {
      console.error(`[BORDEAUX] ${label} error ${res.status}`);
      break;
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

  return allRecords;
}

export async function fetchBordeauxBatch(options: {
  limit: number;
  startOffset: number;
}): Promise<AttribueRecord[]> {
  // Try 2024 dataset first
  try {
    const records = await fetchFromEndpoint(BORDEAUX_API_2024, '2024', options);
    if (records.length > 0) {
      console.log(`[BORDEAUX] 2024 dataset: ${records.length} records`);
      return records;
    }
  } catch (err: any) {
    console.log(`[BORDEAUX] 2024 dataset failed (${err.message}), trying 2019...`);
  }

  // Fallback to 2019 dataset
  try {
    const records = await fetchFromEndpoint(BORDEAUX_API_2019, '2019', options);
    console.log(`[BORDEAUX] 2019 dataset: ${records.length} records`);
    return records;
  } catch (err: any) {
    console.error(`[BORDEAUX] Both datasets failed: ${err.message}`);
    return [];
  }
}
