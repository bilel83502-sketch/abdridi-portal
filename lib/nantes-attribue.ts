/**
 * Scraper Open Data Nantes Métropole — marchés publics attribués
 * API : https://data.nantesmetropole.fr
 *
 * Datasets disponibles (par année, 2015-2024) :
 * 244400404_marches-publics-conclus-{YYYY}-nantes-metropole
 *
 * Champs réels (vérifié 2026-03) :
 * identifiant_du_marche, nom_de_l_acheteur, identifiant_de_l_acheteur,
 * date_de_notification, types_de_contrats, nature, procedure_de_passation,
 * codes_cpv, montant, duree, forme_du_prix, type_identifiant_du_titulaire,
 * identifiant_du_titulaire, denomination_sociale_du_titulaire,
 * code_du_lieu_d_execution, nom_du_lieu_d_execution, objet
 */

import { type AttribueRecord } from './decp-attribue';

const BASE_API = 'https://data.nantesmetropole.fr/api/explore/v2.1/catalog/datasets';

// Années récentes à agréger (les plus récentes en premier)
const DATASETS = [
  '244400404_marches-publics-conclus-2024-nantes-metropole',
  '244400404_marches-publics-conclus-2023-nantes-metropole',
  '244400404_marches-publics-conclus-2022-nantes-metropole',
  '244400404_marches-publics-conclus-2021-nantes-metropole',
  '244400404_marches-publics-conclus-2020-nantes-metropole',
];

function mapNature(raw: string | null | undefined): string {
  if (!raw) return 'SERVICES';
  const lower = raw.toLowerCase();
  if (lower.includes('travaux')) return 'TRAVAUX';
  if (lower.includes('fourniture')) return 'FOURNITURES';
  return 'SERVICES';
}

function getDept(lieu: string | null | undefined): string {
  if (!lieu) return '44';
  const cp = String(lieu);
  if (cp.startsWith('97')) return cp.slice(0, 3);
  return cp.slice(0, 2) || '44';
}

function mapRecord(r: any, datasetYear: string): AttribueRecord | null {
  const id = r.identifiant_du_marche;
  if (!id) return null;

  const objet = r.objet || '';
  const titulaireNom = r.denomination_sociale_du_titulaire || null;
  if (!objet && !titulaireNom) return null;

  const lieuCode = r.code_du_lieu_d_execution ? String(r.code_du_lieu_d_execution) : '';
  const dept = getDept(lieuCode);

  const montant = r.montant ? parseFloat(String(r.montant)) : null;
  const dureeMois = r.duree ? parseInt(String(r.duree)) : null;

  return {
    objet: (objet || 'Marché Nantes Métropole').slice(0, 500),
    acheteurNom: r.nom_de_l_acheteur || 'Nantes Métropole',
    acheteurSiret: r.identifiant_de_l_acheteur ? String(r.identifiant_de_l_acheteur) : null,
    titulaireNom: titulaireNom || 'Non renseigné',
    titulaireSiret: r.identifiant_du_titulaire ? String(r.identifiant_du_titulaire) : null,
    titulaireCommune: r.nom_du_lieu_d_execution || null,
    montant: isNaN(montant!) ? null : montant,
    dateNotification: r.date_de_notification
      ? new Date(r.date_de_notification)
      : null,
    datePublicationDonnees: null,
    nature: mapNature(r.nature || r.types_de_contrats),
    procedure: r.procedure_de_passation || null,
    lieuExecution: r.nom_du_lieu_d_execution || 'Nantes Métropole',
    departement: dept,
    departementNom: dept === '44' ? 'Loire-Atlantique' : null,
    region: 'Pays de la Loire',
    codeCPV: r.codes_cpv ? String(r.codes_cpv).slice(0, 10) : null,
    labelCPV: null,
    source: 'NANTES',
    sourceRef: `NANTES-${datasetYear}-${id}`.slice(0, 250),
    dureeMois: isNaN(dureeMois!) ? null : dureeMois,
    formePrix: r.forme_du_prix || null,
  };
}

async function fetchDataset(
  datasetId: string,
  options: { limit: number; startOffset: number }
): Promise<AttribueRecord[]> {
  const { limit, startOffset } = options;
  const records: AttribueRecord[] = [];
  const seenRefs = new Set<string>();
  let offset = startOffset;
  const pageSize = 100;
  const year = datasetId.match(/conclus-(\d{4})/)?.[1] || 'unknown';

  const apiUrl = `${BASE_API}/${datasetId}/records`;

  while (records.length < limit) {
    const take = Math.min(limit - records.length, pageSize);
    const params = new URLSearchParams({
      limit: take.toString(),
      offset: offset.toString(),
      order_by: 'date_de_notification desc',
    });

    const url = `${apiUrl}?${params}`;
    console.log(`[NANTES] ${year} offset=${offset}...`);

    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) {
        console.error(`[NANTES] ${year} error ${res.status}`);
        break;
      }

      const json = await res.json();
      const results = json.results || [];
      if (results.length === 0) break;

      for (const r of results) {
        const mapped = mapRecord(r, year);
        if (mapped && !seenRefs.has(mapped.sourceRef)) {
          seenRefs.add(mapped.sourceRef);
          records.push(mapped);
        }
      }

      offset += results.length;
      if (results.length < take) break;
    } catch (err: any) {
      console.error(`[NANTES] ${year} fetch error: ${err.message}`);
      break;
    }
  }

  return records;
}

export async function fetchNantesBatch(options: {
  limit: number;
  startOffset: number;
}): Promise<AttribueRecord[]> {
  const allRecords: AttribueRecord[] = [];
  const seenRefs = new Set<string>();
  const perDataset = Math.ceil(options.limit / DATASETS.length);

  for (const datasetId of DATASETS) {
    const batch = await fetchDataset(datasetId, {
      limit: perDataset,
      startOffset: options.startOffset,
    });

    for (const r of batch) {
      if (!seenRefs.has(r.sourceRef)) {
        seenRefs.add(r.sourceRef);
        allRecords.push(r);
      }
    }

    if (allRecords.length >= options.limit) break;

    // Pause entre datasets
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`[NANTES] Total: ${allRecords.length} records`);
  return allRecords.slice(0, options.limit);
}
