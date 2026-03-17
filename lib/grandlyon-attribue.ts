/**
 * Scraper Open Data Grand Lyon — marchés publics attribués
 * API WFS : https://data.grandlyon.com/geoserver/grandlyon/ows
 */

import { type AttribueRecord } from './decp-attribue';

const GRANDLYON_WFS =
  'https://data.grandlyon.com/geoserver/grandlyon/ows?SERVICE=WFS&VERSION=2.0.0&request=GetFeature&typename=grandlyon:mpa_marche_public_attribue&outputFormat=application/json';

const GRANDLYON_ODS =
  'https://data.grandlyon.com/api/explore/v2.1/catalog/datasets/mpa_marche_public_attribue/records';

function mapNature(raw: string | null | undefined): string {
  if (!raw) return 'SERVICES';
  const lower = raw.toLowerCase();
  if (lower.includes('travaux')) return 'TRAVAUX';
  if (lower.includes('fourniture')) return 'FOURNITURES';
  return 'SERVICES';
}

function mapWfsRecord(props: any): AttribueRecord | null {
  const id = props.gid || props.id || props.numero_marche;
  if (!id) return null;

  const objet = props.objet || props.libelle || props.intitule || '';
  const titulaire = props.titulaire || props.attributaire || props.nom_attributaire || '';
  if (!objet && !titulaire) return null;

  return {
    objet: (objet || 'Marché Grand Lyon').slice(0, 500),
    acheteurNom: props.acheteur || props.collectivite || 'Métropole de Lyon',
    acheteurSiret: props.siret_acheteur || null,
    titulaireNom: titulaire || 'Non renseigné',
    titulaireSiret: props.siret_titulaire || props.siret_attributaire || null,
    titulaireCommune: props.commune || null,
    montant: props.montant ? parseFloat(String(props.montant)) : null,
    dateNotification: props.date_notification
      ? new Date(props.date_notification)
      : props.date_attribution
        ? new Date(props.date_attribution)
        : null,
    datePublicationDonnees: props.date_publication
      ? new Date(props.date_publication)
      : null,
    nature: mapNature(props.nature || props.type_marche),
    procedure: props.procedure || null,
    lieuExecution: props.lieu_execution || 'Grand Lyon',
    departement: '69',
    departementNom: 'Rhône',
    region: 'Auvergne-Rhône-Alpes',
    codeCPV: props.code_cpv || null,
    labelCPV: props.libelle_cpv || null,
    source: 'GRANDLYON',
    sourceRef: `GRANDLYON-${id}`.slice(0, 250),
    dureeMois: props.duree_mois ? parseInt(String(props.duree_mois)) : null,
    formePrix: props.forme_prix || null,
  };
}

function mapOdsRecord(r: any): AttribueRecord | null {
  const id = r.id || r.numero_marche || r.gid;
  if (!id) return null;

  const objet = r.objet || r.libelle || r.intitule || '';
  const titulaire = r.titulaire || r.attributaire || r.nom_attributaire || '';
  if (!objet && !titulaire) return null;

  return {
    objet: (objet || 'Marché Grand Lyon').slice(0, 500),
    acheteurNom: r.acheteur || r.collectivite || 'Métropole de Lyon',
    acheteurSiret: r.siret_acheteur || null,
    titulaireNom: titulaire || 'Non renseigné',
    titulaireSiret: r.siret_titulaire || r.siret_attributaire || null,
    titulaireCommune: r.commune || null,
    montant: r.montant ? parseFloat(String(r.montant)) : null,
    dateNotification: r.date_notification
      ? new Date(r.date_notification)
      : r.date_attribution
        ? new Date(r.date_attribution)
        : null,
    datePublicationDonnees: r.date_publication
      ? new Date(r.date_publication)
      : null,
    nature: mapNature(r.nature || r.type_marche),
    procedure: r.procedure || null,
    lieuExecution: r.lieu_execution || 'Grand Lyon',
    departement: '69',
    departementNom: 'Rhône',
    region: 'Auvergne-Rhône-Alpes',
    codeCPV: r.code_cpv || null,
    labelCPV: r.libelle_cpv || null,
    source: 'GRANDLYON',
    sourceRef: `GRANDLYON-${id}`.slice(0, 250),
    dureeMois: r.duree_mois ? parseInt(String(r.duree_mois)) : null,
    formePrix: r.forme_prix || null,
  };
}

export async function fetchGrandLyonBatch(options: {
  limit: number;
  startOffset: number;
}): Promise<AttribueRecord[]> {
  const { limit, startOffset } = options;
  const allRecords: AttribueRecord[] = [];
  const seenRefs = new Set<string>();

  // Try WFS first
  try {
    const wfsUrl = `${GRANDLYON_WFS}&startIndex=${startOffset}&count=${limit}`;
    console.log(`[GRANDLYON] Trying WFS API offset=${startOffset}...`);

    const res = await fetch(wfsUrl, { headers: { Accept: 'application/json' } });
    if (res.ok) {
      const json = await res.json();
      const features = json.features || [];
      for (const f of features) {
        const mapped = mapWfsRecord(f.properties || f);
        if (mapped && !seenRefs.has(mapped.sourceRef)) {
          seenRefs.add(mapped.sourceRef);
          allRecords.push(mapped);
        }
      }
      if (allRecords.length > 0) {
        console.log(`[GRANDLYON] WFS: ${allRecords.length} records`);
        return allRecords;
      }
    }
    console.log('[GRANDLYON] WFS returned no results, trying ODS API...');
  } catch (err: any) {
    console.log(`[GRANDLYON] WFS failed (${err.message}), trying ODS API...`);
  }

  // Fallback to ODS API
  let offset = startOffset;
  const pageSize = 100;

  while (allRecords.length < limit) {
    const remaining = limit - allRecords.length;
    const take = Math.min(remaining, pageSize);

    const params = new URLSearchParams({
      limit: take.toString(),
      offset: offset.toString(),
    });

    const url = `${GRANDLYON_ODS}?${params}`;
    console.log(`[GRANDLYON] ODS offset=${offset}...`);

    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) {
        console.error(`[GRANDLYON] ODS error ${res.status}`);
        break;
      }

      const json = await res.json();
      const results = json.results || [];
      if (results.length === 0) break;

      for (const r of results) {
        const mapped = mapOdsRecord(r);
        if (mapped && !seenRefs.has(mapped.sourceRef)) {
          seenRefs.add(mapped.sourceRef);
          allRecords.push(mapped);
        }
      }

      offset += results.length;
      if (results.length < take) break;
    } catch (err: any) {
      console.error(`[GRANDLYON] ODS error: ${err.message}`);
      break;
    }
  }

  console.log(`[GRANDLYON] Batch: ${allRecords.length} records`);
  return allRecords;
}
