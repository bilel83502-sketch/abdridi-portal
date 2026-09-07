/**
 * safetender.com — SOURCE INDISPONIBLE
 *
 * Statut : safetender.com redirige désormais vers omnikles.com (suite rachat/fusion)
 * omnikles.com n'expose aucune liste publique d'appels d'offres.
 *
 * La plateforme Omnikles/Klekoon est déjà couverte par lib/klekoon.ts
 * qui scrape klekoon.com/liste-annonces-acheteur-public directement.
 *
 * TODO : Réactiver si safetender.com redevient autonome ou si une URL
 * publique est trouvée sur la plateforme Omnikles.
 *
 * Vérifié le : 2026-03-21
 */

/* ───── Type retour ───── */
export interface SafetenderMarche {
  title: string;
  buyer: string;
  nature: string;
  department: string;
  departmentName: string | null;
  region: string | null;
  value: number | null;
  deadline: Date | null;
  publicationDate: Date | null;
  source: string;
  sourceRef: string;
  procedureType: string | null;
  cpvCode: string | null;
  cpvLabel: string | null;
  lots: number;
  duration: string | null;
  status: string;
}

/* ───── Fonction principale ───── */
export async function fetchSafetenderRecords(_options?: {
  limit?: number;
  maxBuyers?: number;
}): Promise<SafetenderMarche[]> {
  console.warn(
    '[SAFETENDER] Source indisponible : safetender.com redirige vers omnikles.com ' +
    'qui ne propose pas de listing public. ' +
    'La plateforme Omnikles est déjà couverte par klekoon.ts.'
  );
  return [];
}
