/**
 * Scraper Open Data Strasbourg Eurométropole — marchés publics attribués
 * API : https://data.strasbourg.eu
 * Dataset : donnees_essentielles_des_marches_publics (2018-2023)
 */

import { type AttribueRecord } from './decp-attribue';

const STRASBOURG_API =
  'https://data.strasbourg.eu/api/explore/v2.1/catalog/datasets/donnees_essentielles_des_marches_publics/records';

function mapNature(raw: string | null | undefined): string {
  if (!raw) return 'SERVICES';
  const lower = raw.toLowerCase();
  if (lower.includes('travaux')) return 'TRAVAUX';
  if (lower.includes('fourniture')) return 'FOURNITURES';
  return 'SERVICES';
}

function mapRecord(r: any): AttribueRecord | null {
  const id = r.annee_numero_marche || r.numero_marche;
  if (!id) return null;

  const objet = r.objet_du_marche || '';
  const titulaireNom = r.raison_sociale_titulaire || null;
  if (!objet && !titulaireNom) return null;

  return {
    objet: (objet || 'Marché Strasbourg Eurométropole').slice(0, 500),
    acheteurNom: r.acheteur || 'Eurométropole de Strasbourg',
    acheteurSiret: r.siret_acheteur || null,
    titulaireNom: titulaireNom || 'Non renseigné',
    titulaireSiret: r.numero_siret_titulaire || null,
    titulaireCommune: r.ville_du_contractant || null,
    montant: r.montant ? parseFloat(String(r.montant)) : null,
    dateNotification: null, // Pas de date de notification, juste l'année
    datePublicationDonnees: r.annee ? new Date(`${r.annee}-01-01`) : null,
    nature: mapNature(r.nature || r.categorie_achat),
    procedure: r.procedure || null,
    lieuExecution: 'Strasbourg Eurométropole',
    departement: '67',
    departementNom: 'Bas-Rhin',
    region: 'Grand Est',
    codeCPV: null,
    labelCPV: r.categorie_achat || null,
    source: 'STRASBOURG',
    sourceRef: `STRASBOURG-${id}`.slice(0, 250),
    dureeMois: null,
    formePrix: r.forme_de_prix || null,
  };
}

export async function fetchStrasbourgBatch(options: {
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
    });

    const url = `${STRASBOURG_API}?${params}`;
    console.log(`[STRASBOURG] Fetching offset=${offset}...`);

    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) {
        console.error(`[STRASBOURG] API error ${res.status}`);
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
      console.error(`[STRASBOURG] Fetch error: ${err.message}`);
      break;
    }
  }

  console.log(`[STRASBOURG] Batch: ${allRecords.length} records`);
  return allRecords;
}
