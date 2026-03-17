/**
 * Scraper Open Data Rennes Métropole — marchés publics attribués
 * API : https://data.rennesmetropole.fr
 * Dataset : marche-conclu (marchés conclus par Rennes Métropole et la ville de Rennes)
 */

import { type AttribueRecord } from './decp-attribue';

const RENNES_API =
  'https://data.rennesmetropole.fr/api/explore/v2.1/catalog/datasets/marche-conclu/records';

function mapNature(raw: string | null | undefined): string {
  if (!raw) return 'SERVICES';
  const lower = raw.toLowerCase();
  if (lower.includes('travaux')) return 'TRAVAUX';
  if (lower.includes('fourniture')) return 'FOURNITURES';
  return 'SERVICES';
}

function mapRecord(r: any): AttribueRecord | null {
  const id = r.code_contractant_marche || r.objet_marche;
  if (!id) return null;

  const objet = r.objet_marche || '';
  const titulaireNom = r.nom_contractant_marche || null;
  if (!objet && !titulaireNom) return null;

  const dept = r.departement ? String(r.departement).padStart(2, '0') : '35';

  return {
    objet: (objet || 'Marché Rennes Métropole').slice(0, 500),
    acheteurNom: r.collectivite || 'Rennes Métropole',
    acheteurSiret: null,
    titulaireNom: titulaireNom || 'Non renseigné',
    titulaireSiret: r.siret || null,
    titulaireCommune: null,
    montant: null, // Pas de montant dans ce dataset
    dateNotification: r.date_notification_marche
      ? new Date(r.date_notification_marche)
      : null,
    datePublicationDonnees: null,
    nature: mapNature(r.categorie_de_marche),
    procedure: null,
    lieuExecution: 'Rennes Métropole',
    departement: dept,
    departementNom: dept === '35' ? 'Ille-et-Vilaine' : null,
    region: 'Bretagne',
    codeCPV: r.code_cpv || null,
    labelCPV: null,
    source: 'RENNES',
    sourceRef: `RENNES-${r.code_contractant_marche || objet.slice(0, 100)}`.slice(0, 250),
    dureeMois: r.duree_d_execution_marche
      ? parseInt(String(r.duree_d_execution_marche))
      : null,
    formePrix: null,
  };
}

export async function fetchRennesBatch(options: {
  limit: number;
  startOffset: number;
}): Promise<AttribueRecord[]> {
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
      order_by: 'date_notification_marche desc',
    });

    const url = `${RENNES_API}?${params}`;
    console.log(`[RENNES] Fetching offset=${offset}...`);

    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) {
        console.error(`[RENNES] API error ${res.status}`);
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
    } catch (err: any) {
      console.error(`[RENNES] Fetch error: ${err.message}`);
      break;
    }
  }

  console.log(`[RENNES] Batch: ${allRecords.length} records`);
  return allRecords;
}
