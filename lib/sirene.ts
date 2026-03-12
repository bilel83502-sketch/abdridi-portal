/**
 * Client pour l'API Annuaire des Entreprises (recherche-entreprises.api.gouv.fr)
 * API gratuite, sans clé — rate limit : 7 req/s
 */

const API_URL = 'https://recherche-entreprises.api.gouv.fr/search';

/* ─── Mapping tranche d'effectifs INSEE ─── */
const TRANCHES_EFFECTIFS: Record<string, string> = {
  '00': '0 salarié',
  '01': '1 ou 2 salariés',
  '02': '3 à 5 salariés',
  '03': '6 à 9 salariés',
  '11': '10 à 19 salariés',
  '12': '20 à 49 salariés',
  '21': '50 à 99 salariés',
  '22': '100 à 199 salariés',
  '31': '200 à 249 salariés',
  '32': '250 à 499 salariés',
  '41': '500 à 999 salariés',
  '42': '1 000 à 1 999 salariés',
  '51': '2 000 à 4 999 salariés',
  '52': '5 000 à 9 999 salariés',
  '53': '10 000 salariés et plus',
  'NN': 'Non renseigné',
};

export interface EntrepriseData {
  siren: string;
  raisonSociale: string;
  formeJuridique: string | null;
  codeNaf: string | null;
  activite: string | null;
  effectifs: string | null;
  adresse: string | null;
  dateCreation: Date | null;
  statut: string; // "Actif" | "Fermé"
}

/**
 * Extrait le SIREN (9 premiers chiffres) d'un SIRET (14 chiffres) ou SIREN
 */
export function extractSiren(siretOrSiren: string): string {
  const clean = siretOrSiren.replace(/\s/g, '');
  return clean.substring(0, 9);
}

/**
 * Récupère les infos d'une entreprise via l'API Annuaire des Entreprises
 */
export async function fetchEntreprise(siren: string): Promise<EntrepriseData | null> {
  try {
    const res = await fetch(`${API_URL}?q=${siren}&page=1&per_page=1`, {
      headers: { 'Accept': 'application/json' },
    });

    if (res.status === 429) {
      // Rate limited — caller should retry after delay
      throw new Error('RATE_LIMITED');
    }

    if (!res.ok) {
      console.error(`[sirene] API error ${res.status} for SIREN ${siren}`);
      return null;
    }

    const json = await res.json();
    if (!json.results || json.results.length === 0) {
      console.log(`[sirene] No result for SIREN ${siren}`);
      return null;
    }

    const r = json.results[0];

    // Vérifier que le SIREN correspond
    if (r.siren !== siren) {
      console.log(`[sirene] SIREN mismatch: expected ${siren}, got ${r.siren}`);
      return null;
    }

    const siege = r.siege || {};

    // Construire l'adresse complète
    const adresseParts = [
      siege.numero_voie,
      siege.type_voie,
      siege.libelle_voie,
      siege.code_postal,
      siege.libelle_commune,
    ].filter(Boolean);
    const adresse = adresseParts.length > 0 ? adresseParts.join(' ') : null;

    // Tranche d'effectifs
    const trancheCode = r.tranche_effectif_salarie || siege.tranche_effectif_salarie;
    const effectifs = trancheCode ? (TRANCHES_EFFECTIFS[trancheCode] || trancheCode) : null;

    // Date de création
    let dateCreation: Date | null = null;
    if (r.date_creation) {
      dateCreation = new Date(r.date_creation);
      if (isNaN(dateCreation.getTime())) dateCreation = null;
    }

    return {
      siren: r.siren,
      raisonSociale: r.nom_complet || r.nom_raison_sociale || siren,
      formeJuridique: r.nature_juridique
        ? (r.libelle_nature_juridique || r.nature_juridique)
        : null,
      codeNaf: r.activite_principale || siege.activite_principale || null,
      activite: r.libelle_activite_principale || siege.libelle_activite_principale || null,
      effectifs,
      adresse,
      dateCreation,
      statut: r.etat_administratif === 'A' ? 'Actif' : 'Fermé',
    };
  } catch (err: any) {
    if (err.message === 'RATE_LIMITED') throw err;
    console.error(`[sirene] Error fetching SIREN ${siren}:`, err.message);
    return null;
  }
}

/**
 * Pause pour respecter le rate limiting (200ms = 5 req/s, safe under 7/s limit)
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
