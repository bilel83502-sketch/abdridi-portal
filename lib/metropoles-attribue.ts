/**
 * Scrapers Open Data pour les métropoles — marchés publics attribués
 * APIs Opendatasoft v2.1
 *
 * Métropoles actives :
 * - Hauts-de-Seine (92)
 * - Aix-Marseille-Provence (AMP)
 *
 * Désactivées (pas de jeu de données marchés publics) :
 * - Nice Côte d'Azur — portail CKAN down (Rails 404)
 * - Lille Métropole — portail migré, plus d'API Opendatasoft
 * - Montpellier — portail DKAN, pas de dataset marchés publics
 */

import { type AttribueRecord } from './decp-attribue';

// ── Helpers ───────────────────────────────────────────────────────

function mapNature(raw: string | null | undefined): string {
  if (!raw) return 'SERVICES';
  const lower = raw.toLowerCase();
  if (lower.includes('travaux')) return 'TRAVAUX';
  if (lower.includes('fourniture')) return 'FOURNITURES';
  return 'SERVICES';
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Generic Opendatasoft fetcher ──────────────────────────────────

interface MetropoleConfig {
  code: string;
  name: string;
  apiUrl: string;
  orderBy: string;
  departement: string;
  departementNom: string;
  region: string;
  mapRecord: (r: any) => AttribueRecord | null;
}

async function fetchOpendatasoftBatch(
  config: MetropoleConfig,
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
      order_by: config.orderBy,
    });

    const url = `${config.apiUrl}?${params}`;
    console.log(`[${config.code}] Fetching offset=${offset}, limit=${take}...`);

    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) {
        const body = await res.text();
        console.error(
          `[${config.code}] API error ${res.status}: ${body.slice(0, 200)}`
        );
        break;
      }

      const json = await res.json();
      const results = json.results || [];
      if (results.length === 0) break;

      for (const r of results) {
        const mapped = config.mapRecord(r);
        if (mapped && !seenRefs.has(mapped.sourceRef)) {
          seenRefs.add(mapped.sourceRef);
          allRecords.push(mapped);
        }
      }

      offset += results.length;
      if (results.length < take) break;
    } catch (err: any) {
      console.error(`[${config.code}] Fetch error: ${err.message}`);
      break;
    }
  }

  console.log(`[${config.code}] Batch: ${allRecords.length} records`);
  return allRecords;
}

// ── Hauts-de-Seine (92) ──────────────────────────────────────────
// API fields: num_contrat, nature, seuil, objet, attributaire, cp, pays, date_notification

const HAUTS_DE_SEINE_CONFIG: MetropoleConfig = {
  code: 'HDS92',
  name: 'Hauts-de-Seine',
  apiUrl:
    'https://opendata.hauts-de-seine.fr/api/explore/v2.1/catalog/datasets/marches-publics/records',
  orderBy: 'date_notification desc',
  departement: '92',
  departementNom: 'Hauts-de-Seine',
  region: 'Île-de-France',
  mapRecord(r: any): AttribueRecord | null {
    const id = r.num_contrat || r.id || r.uid || r.recordid;
    if (!id) return null;

    const objet = r.objet || '';
    const titulaireNom = r.attributaire || null;
    if (!objet && !titulaireNom) return null;

    return {
      objet: (objet || 'Marché Hauts-de-Seine').slice(0, 500),
      acheteurNom: 'Département des Hauts-de-Seine',
      acheteurSiret: null,
      titulaireNom: titulaireNom || 'Non renseigné',
      titulaireSiret: null,
      titulaireCommune: null,
      montant: null,
      dateNotification: r.date_notification
        ? new Date(r.date_notification)
        : null,
      datePublicationDonnees: null,
      nature: mapNature(r.nature),
      procedure: null,
      lieuExecution: r.cp || 'Hauts-de-Seine',
      departement: '92',
      departementNom: 'Hauts-de-Seine',
      region: 'Île-de-France',
      codeCPV: null,
      labelCPV: null,
      source: 'METROPOLE-HDS92',
      sourceRef: `METROPOLE-HDS92-${id}`.slice(0, 250),
      dureeMois: null,
      formePrix: null,
    };
  },
};

// ── Aix-Marseille-Provence (AMP) ────────────────────────────────
// API fields: id, acheteur_id, acheteur_nom, nature, objet, codecpv, procedure,
//   lieuexecution_code, dureemois, datenotification, datepublicationdonnees,
//   montant, formeprix, titulaires_id, titulaires_denominationsociale

const AMP_CONFIG: MetropoleConfig = {
  code: 'AMP',
  name: 'Aix-Marseille-Provence',
  apiUrl:
    'https://data.ampmetropole.fr/api/explore/v2.1/catalog/datasets/ls-marches-publics/records',
  orderBy: 'datenotification desc',
  departement: '13',
  departementNom: 'Bouches-du-Rhône',
  region: "Provence-Alpes-Côte d'Azur",
  mapRecord(r: any): AttribueRecord | null {
    const id = r.id || r.uid || r.recordid;
    if (!id) return null;

    const objet = r.objet || '';
    const titulaireNom = r.titulaires_denominationsociale || null;
    if (!objet && !titulaireNom) return null;

    const montant = r.montant;

    return {
      objet: (objet || 'Marché AMP').slice(0, 500),
      acheteurNom: r.acheteur_nom || 'Métropole Aix-Marseille-Provence',
      acheteurSiret: r.acheteur_id || null,
      titulaireNom: titulaireNom || 'Non renseigné',
      titulaireSiret: r.titulaires_id || null,
      titulaireCommune: null,
      montant: montant != null ? parseFloat(String(montant)) : null,
      dateNotification: r.datenotification
        ? new Date(r.datenotification)
        : null,
      datePublicationDonnees: r.datepublicationdonnees
        ? new Date(r.datepublicationdonnees)
        : null,
      nature: mapNature(r.nature),
      procedure: r.procedure || null,
      lieuExecution: r.lieuexecution_nom || 'Aix-Marseille-Provence',
      departement: '13',
      departementNom: 'Bouches-du-Rhône',
      region: "Provence-Alpes-Côte d'Azur",
      codeCPV: r.codecpv ? String(r.codecpv).split('-')[0] : null,
      labelCPV: null,
      source: 'METROPOLE-AMP',
      sourceRef: `METROPOLE-AMP-${id}`.slice(0, 250),
      dureeMois: r.dureemois ? parseInt(String(r.dureemois)) : null,
      formePrix: r.formeprix || null,
    };
  },
};

// ── Exports ──────────────────────────────────────────────────────

export const METROPOLES: MetropoleConfig[] = [
  HAUTS_DE_SEINE_CONFIG,
  AMP_CONFIG,
  // Nice, Lille, Montpellier désactivées — pas de dataset marchés publics disponible
];

export async function fetchMetropoleBatch(
  config: MetropoleConfig,
  options: { limit: number; startOffset: number }
): Promise<AttribueRecord[]> {
  return fetchOpendatasoftBatch(config, options);
}

export { sleep };
