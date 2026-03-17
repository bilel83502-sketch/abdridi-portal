/**
 * Scraper Open Data Toulouse Métropole — marchés publics attribués
 * API : https://data.toulouse-metropole.fr
 *
 * NOTE : Seul le dataset "marches-publics-2012-toulouse-metropole" existe,
 * avec des données uniquement de 2012 et des champs mal labellisés.
 * Ce scraper retourne [] en attendant un dataset plus récent.
 */

import { type AttribueRecord } from './decp-attribue';

// Dataset disponible mais obsolète (2012 uniquement)
// const TOULOUSE_API =
//   'https://data.toulouse-metropole.fr/api/explore/v2.1/catalog/datasets/marches-publics-2012-toulouse-metropole/records';

export async function fetchToulouseBatch(_options: {
  limit: number;
  startOffset: number;
}): Promise<AttribueRecord[]> {
  // API inaccessible ou données obsolètes (2012 uniquement) — désactivé
  console.log('[TOULOUSE] Scraper désactivé — dataset limité à 2012');
  return [];
}
