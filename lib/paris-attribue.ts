/**
 * Scraper Open Data Paris — marchés publics attribués
 * API : https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/marches-publics-paris/records
 */

import { type AttribueRecord } from './decp-attribue';

const PARIS_API =
  'https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/marches-publics-paris/records';

function mapNature(raw: string | null | undefined): string {
  if (!raw) return 'SERVICES';
  const lower = raw.toLowerCase();
  if (lower.includes('travaux')) return 'TRAVAUX';
  if (lower.includes('fourniture')) return 'FOURNITURES';
  return 'SERVICES';
}

function mapRecord(r: any): AttribueRecord | null {
  const id = r.id || r.numero_marche || r.identifiant;
  if (!id) return null;

  const objet = r.objet || r.libelle || r.intitule || '';
  const titulaire =
    r.titulaire || r.attributaire || r.nom_attributaire ||
    r.titulaire_nom || r.denominationsociale || '';

  if (!objet && !titulaire) return null;

  return {
    objet: (objet || 'Marché Paris').slice(0, 500),
    acheteurNom: r.acheteur || r.acheteur_nom || r.collectivite || 'Ville de Paris',
    acheteurSiret: r.siret_acheteur || r.acheteur_id || null,
    titulaireNom: titulaire || 'Non renseigné',
    titulaireSiret: r.siret_titulaire || r.titulaire_id || null,
    titulaireCommune: r.commune || null,
    montant: r.montant ? parseFloat(String(r.montant)) : null,
    dateNotification: r.date_notification
      ? new Date(r.date_notification)
      : r.datenotification
        ? new Date(r.datenotification)
        : null,
    datePublicationDonnees: r.date_publication
      ? new Date(r.date_publication)
      : null,
    nature: mapNature(r.nature || r.type_marche),
    procedure: r.procedure || null,
    lieuExecution: r.lieu_execution || 'Paris',
    departement: '75',
    departementNom: 'Paris',
    region: 'Île-de-France',
    codeCPV: r.code_cpv || r.codecpv || null,
    labelCPV: r.libelle_cpv || null,
    source: 'PARIS',
    sourceRef: `PARIS-${id}`.slice(0, 250),
    dureeMois: r.duree_mois ? parseInt(String(r.duree_mois)) : null,
    formePrix: r.forme_prix || null,
  };
}

export async function fetchParisBatch(options: {
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

    const url = `${PARIS_API}?${params}`;
    console.log(`[PARIS] Fetching offset=${offset}, limit=${take}...`);

    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) {
        const body = await res.text();
        console.error(`[PARIS] API error ${res.status}: ${body.slice(0, 200)}`);
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
      console.error(`[PARIS] Fetch error: ${err.message}`);
      break;
    }
  }

  console.log(`[PARIS] Batch: ${allRecords.length} records`);
  return allRecords;
}
