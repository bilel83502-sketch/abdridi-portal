/**
 * Scraper Open Data Nantes Métropole — marchés publics attribués
 * API : https://data.nantesmetropole.fr
 *
 * NOTE : Les datasets disponibles couvrent uniquement 2012-2015
 * avec très peu de champs (pas de montant, pas de SIRET, pas de CPV).
 * Ce scraper retourne [] en attendant un dataset plus récent.
 */

import { type AttribueRecord } from './decp-attribue';

// Datasets disponibles mais obsolètes (2012-2015)
// const NANTES_API =
//   'https://data.nantesmetropole.fr/api/explore/v2.1/catalog/datasets/244400404_marches-publics-conclus-2014-nantes-metropole/records';

export async function fetchNantesBatch(_options: {
  limit: number;
  startOffset: number;
}): Promise<AttribueRecord[]> {
  // API avec données obsolètes (2012-2015) et champs insuffisants — désactivé
  console.log('[NANTES] Scraper désactivé — datasets limités à 2012-2015');
  return [];
}
