/**
 * Enrichissement SIRENE — complète titulaireNom à partir du SIRET
 * Utilise l'API recherche-entreprises.api.gouv.fr (gratuite, sans clé)
 * Fallback : api.insee.fr/api-sirene/3.11 (accès public limité)
 */

import { prisma } from './prisma';

const GOUV_API = 'https://recherche-entreprises.api.gouv.fr/search';
const INSEE_API = 'https://api.insee.fr/api-sirene/3.11/siret';

interface EnrichResult {
  total: number;
  enriched: number;
  failed: number;
  errors: string[];
}

async function fetchNomFromGouv(siret: string): Promise<string | null> {
  try {
    const res = await fetch(`${GOUV_API}?q=${siret}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;

    const json = await res.json();
    const results = json.results || [];
    if (results.length === 0) return null;

    // Match on SIRET (siege or matching etablissement)
    const entreprise = results[0];
    return (
      entreprise.nom_complet ||
      entreprise.nom_raison_sociale ||
      entreprise.denomination ||
      null
    );
  } catch {
    return null;
  }
}

async function fetchNomFromInsee(siret: string): Promise<string | null> {
  try {
    const res = await fetch(`${INSEE_API}/${siret}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;

    const json = await res.json();
    const uniteLegale = json.etablissement?.uniteLegale;
    if (!uniteLegale) return null;

    return (
      uniteLegale.denominationUniteLegale ||
      uniteLegale.nomUniteLegale ||
      null
    );
  } catch {
    return null;
  }
}

async function fetchNom(siret: string): Promise<string | null> {
  // Try gouv API first (more reliable, no rate limit issues)
  const nom = await fetchNomFromGouv(siret);
  if (nom) return nom;

  // Fallback to INSEE
  return fetchNomFromInsee(siret);
}

export async function enrichSirene(batchSize = 200): Promise<EnrichResult> {
  const records = await prisma.marcheAttribue.findMany({
    where: {
      titulaireNom: { equals: null } as any,
      titulaireSiret: { not: null },
    },
    select: { id: true, titulaireSiret: true },
    take: batchSize,
  });

  // Also get records where titulaireNom starts with "SIRET " (placeholder)
  const placeholderRecords = await prisma.marcheAttribue.findMany({
    where: {
      titulaireNom: { startsWith: 'SIRET ' },
      titulaireSiret: { not: null },
    },
    select: { id: true, titulaireSiret: true },
    take: Math.max(0, batchSize - records.length),
  });

  const allRecords = [...records, ...placeholderRecords];

  console.log(`[SIRENE] ${allRecords.length} records to enrich`);

  let enriched = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const record of allRecords) {
    const siret = record.titulaireSiret!;

    try {
      const nom = await fetchNom(siret);
      if (nom) {
        await prisma.marcheAttribue.update({
          where: { id: record.id },
          data: { titulaireNom: nom },
        });
        enriched++;
        console.log(`[SIRENE] ${siret} → ${nom}`);
      } else {
        failed++;
      }
    } catch (err: any) {
      failed++;
      errors.push(`${siret}: ${err.message}`);
    }

    // Rate limiting: 200ms between requests to avoid throttling
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  console.log(`[SIRENE] Enrichment complete: ${enriched} enriched, ${failed} failed`);
  return { total: allRecords.length, enriched, failed, errors: errors.slice(0, 10) };
}
