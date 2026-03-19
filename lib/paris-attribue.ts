/**
 * Scraper Open Data Paris — marchés publics attribués
 * API : https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/liste-des-marches-de-la-collectivite-parisienne/records
 * Total : ~17 639 records
 *
 * Champs réels (vérifié 2026-03) :
 * annee_de_notification, num_marche, objet_du_marche, nature_du_marche,
 * fournisseur_nom, fournisseur_siret, fournisseur_code_postal, fournisseur_ville,
 * montant_min, montant_max, date_de_notification, date_de_debut, date_de_fin,
 * duree_du_marche_en_jours, perimetre_financier, categorie_d_achat_cle, categorie_d_achat_texte
 */

import { type AttribueRecord } from './decp-attribue';

const PARIS_API =
  'https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/liste-des-marches-de-la-collectivite-parisienne/records';

function mapNature(raw: string | null | undefined): string {
  if (!raw) return 'SERVICES';
  const lower = raw.toLowerCase();
  if (lower.includes('travaux')) return 'TRAVAUX';
  if (lower.includes('fourniture')) return 'FOURNITURES';
  return 'SERVICES';
}

function mapRecord(r: any): AttribueRecord | null {
  const id = r.num_marche;
  if (!id) return null;

  const objet = r.objet_du_marche || '';
  const titulaireNom = r.fournisseur_nom || null;
  if (!objet && !titulaireNom) return null;

  // Montant : on prend montant_max en priorité, sinon montant_min
  const montant = r.montant_max
    ? parseFloat(String(r.montant_max))
    : r.montant_min
      ? parseFloat(String(r.montant_min))
      : null;

  // Durée en jours → mois
  const dureeMois = r.duree_du_marche_en_jours
    ? Math.round(parseInt(String(r.duree_du_marche_en_jours)) / 30)
    : null;

  // Département depuis le code postal du fournisseur
  const cp = r.fournisseur_code_postal ? String(r.fournisseur_code_postal) : '';
  const dept = cp.startsWith('97') ? cp.slice(0, 3) : cp.slice(0, 2) || '75';

  return {
    objet: (objet || 'Marché Paris').slice(0, 500),
    acheteurNom: r.perimetre_financier || 'Collectivité Parisienne',
    acheteurSiret: null,
    titulaireNom: titulaireNom || 'Non renseigné',
    titulaireSiret: r.fournisseur_siret ? String(r.fournisseur_siret) : null,
    titulaireCommune: r.fournisseur_ville || null,
    montant: isNaN(montant!) ? null : montant,
    dateNotification: r.date_de_notification
      ? new Date(r.date_de_notification)
      : null,
    datePublicationDonnees: r.date_de_debut
      ? new Date(r.date_de_debut)
      : null,
    nature: mapNature(r.nature_du_marche),
    procedure: null,
    lieuExecution: 'Paris',
    departement: dept || '75',
    departementNom: 'Paris',
    region: 'Île-de-France',
    codeCPV: r.categorie_d_achat_cle || null,
    labelCPV: r.categorie_d_achat_texte || null,
    source: 'PARIS',
    sourceRef: `PARIS-${id}`.slice(0, 250),
    dureeMois,
    formePrix: null,
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
      order_by: 'date_de_notification desc',
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
