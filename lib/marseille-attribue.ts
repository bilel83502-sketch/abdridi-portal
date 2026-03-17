/**
 * Scraper Open Data Aix-Marseille Métropole — marchés publics attribués
 * API : https://data.ampmetropole.fr
 * Dataset : ls-marches-publics (format DECP, ~2871 records)
 */

import { type AttribueRecord } from './decp-attribue';

const MARSEILLE_API =
  'https://data.ampmetropole.fr/api/explore/v2.1/catalog/datasets/ls-marches-publics/records';

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
  const titulaireNom = r.titulaires_denominationsociale || null;
  if (!objet && !titulaireNom) return null;

  const titulaireSiret = r.titulaires_id || null;
  const dept = r.lieuexecution_code
    ? String(r.lieuexecution_code).slice(0, 2)
    : '13';

  return {
    objet: (objet || 'Marché Aix-Marseille Métropole').slice(0, 500),
    acheteurNom: r.acheteur_nom || 'Métropole Aix-Marseille-Provence',
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
    lieuExecution: r.lieuexecution_nom || 'Aix-Marseille Métropole',
    departement: dept,
    departementNom: dept === '13' ? 'Bouches-du-Rhône' : null,
    region: "Provence-Alpes-Côte d'Azur",
    codeCPV: r.codecpv || null,
    labelCPV: null,
    source: 'MARSEILLE',
    sourceRef: `MARSEILLE-${id}`.slice(0, 250),
    dureeMois: r.dureemois ? parseInt(String(r.dureemois)) : null,
    formePrix: r.formeprix || null,
  };
}

export async function fetchMarseilleBatch(options: {
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
      order_by: 'datenotification desc',
    });

    const url = `${MARSEILLE_API}?${params}`;
    console.log(`[MARSEILLE] Fetching offset=${offset}...`);

    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) {
        console.error(`[MARSEILLE] API error ${res.status}`);
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
      console.error(`[MARSEILLE] Fetch error: ${err.message}`);
      break;
    }
  }

  console.log(`[MARSEILLE] Batch: ${allRecords.length} records`);
  return allRecords;
}
