/**
 * Script d'enrichissement des entreprises via l'API Annuaire des Entreprises
 * Usage : npx tsx scripts/enrich-entreprises.ts --limit=50
 */

import { PrismaClient } from '@prisma/client';
import { extractSiren, fetchEntreprise, sleep } from '../lib/sirene';

const prisma = new PrismaClient();

async function main() {
  const limitArg = process.argv.find(a => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 50;

  console.log(`[enrich] Starting enrichment (limit: ${limit})...`);

  // Get all unique SIRENs from MarcheAttribue
  const marchesWithSiret = await prisma.marcheAttribue.findMany({
    where: { titulaireSiret: { not: null } },
    select: { titulaireSiret: true },
    distinct: ['titulaireSiret'],
  });

  const sirenSet = new Set<string>();
  for (const m of marchesWithSiret) {
    if (m.titulaireSiret && m.titulaireSiret.length >= 9) {
      sirenSet.add(extractSiren(m.titulaireSiret));
    }
  }

  // Filter out already-enriched
  const existing = await prisma.entreprise.findMany({ select: { siren: true } });
  const existingSet = new Set(existing.map(e => e.siren));
  const toEnrich = Array.from(sirenSet).filter(s => !existingSet.has(s)).slice(0, limit);

  console.log(`[enrich] ${sirenSet.size} unique SIRENs, ${existingSet.size} already enriched, ${toEnrich.length} to process`);

  let enriched = 0;
  let errors = 0;

  for (let i = 0; i < toEnrich.length; i++) {
    const siren = toEnrich[i];
    process.stdout.write(`\r[enrich] ${i + 1}/${toEnrich.length} — SIREN ${siren}...`);

    try {
      const data = await fetchEntreprise(siren);
      if (data) {
        await prisma.entreprise.upsert({
          where: { siren },
          create: {
            siren: data.siren,
            raisonSociale: data.raisonSociale,
            formeJuridique: data.formeJuridique,
            codeNaf: data.codeNaf,
            activite: data.activite,
            effectifs: data.effectifs,
            adresse: data.adresse,
            dateCreation: data.dateCreation,
            statut: data.statut,
          },
          update: {
            raisonSociale: data.raisonSociale,
            formeJuridique: data.formeJuridique,
            codeNaf: data.codeNaf,
            activite: data.activite,
            effectifs: data.effectifs,
            adresse: data.adresse,
            dateCreation: data.dateCreation,
            statut: data.statut,
            enrichiLe: new Date(),
          },
        });
        enriched++;
      } else {
        errors++;
      }
    } catch (err: any) {
      if (err.message === 'RATE_LIMITED') {
        console.log('\n[enrich] Rate limited, waiting 2s...');
        await sleep(2000);
        i--; // Retry this SIREN
        continue;
      }
      errors++;
      console.error(`\n[enrich] Error for ${siren}:`, err.message);
    }

    await sleep(250);
  }

  console.log(`\n[enrich] Done: ${enriched} enriched, ${errors} errors`);

  // Phase 2 : Enrichir les noms dans MarcheAttribue
  await enrichNomsMarcheAttribue(limit);

  await prisma.$disconnect();
}

/**
 * Enrichit les acheteurNom/titulaireNom placeholder ("Acheteur 12345..." / "Titulaire 12345...")
 * en allant chercher la raison sociale dans la table Entreprise ou via l'API Sirene
 */
async function enrichNomsMarcheAttribue(limit: number) {
  console.log(`\n[enrich-noms] Recherche des marchés avec noms placeholder...`);

  // Find marchés with placeholder names
  const marchesAcheteur = await prisma.marcheAttribue.findMany({
    where: { acheteurNom: { startsWith: 'Acheteur ' } },
    select: { acheteurSiret: true },
    distinct: ['acheteurSiret'],
  });

  const marchesTitulaire = await prisma.marcheAttribue.findMany({
    where: { titulaireNom: { startsWith: 'Titulaire ' } },
    select: { titulaireSiret: true },
    distinct: ['titulaireSiret'],
  });

  // Collect unique SIRETs to resolve
  const siretsToResolve = new Set<string>();
  for (const m of marchesAcheteur) {
    if (m.acheteurSiret) siretsToResolve.add(m.acheteurSiret);
  }
  for (const m of marchesTitulaire) {
    if (m.titulaireSiret) siretsToResolve.add(m.titulaireSiret);
  }

  const allSirets = Array.from(siretsToResolve).slice(0, limit);
  console.log(`[enrich-noms] ${siretsToResolve.size} SIRETs uniques à résoudre (limité à ${allSirets.length})`);

  let resolved = 0;
  let notFound = 0;

  for (let i = 0; i < allSirets.length; i++) {
    const siret = allSirets[i];
    const siren = extractSiren(siret);
    process.stdout.write(`\r[enrich-noms] ${i + 1}/${allSirets.length} — SIRET ${siret}...`);

    // Check if already in Entreprise table
    let entreprise = await prisma.entreprise.findUnique({ where: { siren } });

    if (!entreprise) {
      // Fetch from API
      try {
        const data = await fetchEntreprise(siren);
        if (data) {
          entreprise = await prisma.entreprise.upsert({
            where: { siren },
            create: {
              siren: data.siren,
              raisonSociale: data.raisonSociale,
              formeJuridique: data.formeJuridique,
              codeNaf: data.codeNaf,
              activite: data.activite,
              effectifs: data.effectifs,
              adresse: data.adresse,
              dateCreation: data.dateCreation,
              statut: data.statut,
            },
            update: {
              raisonSociale: data.raisonSociale,
              enrichiLe: new Date(),
            },
          });
        }
      } catch (err: any) {
        if (err.message === 'RATE_LIMITED') {
          console.log('\n[enrich-noms] Rate limited, waiting 2s...');
          await sleep(2000);
          i--;
          continue;
        }
      }
      await sleep(250);
    }

    if (entreprise) {
      const nom = entreprise.raisonSociale;

      // Update acheteurNom where this SIRET is the acheteur
      await prisma.marcheAttribue.updateMany({
        where: { acheteurSiret: siret, acheteurNom: { startsWith: 'Acheteur ' } },
        data: { acheteurNom: nom },
      });

      // Update titulaireNom where this SIRET is the titulaire
      await prisma.marcheAttribue.updateMany({
        where: { titulaireSiret: siret, titulaireNom: { startsWith: 'Titulaire ' } },
        data: { titulaireNom: nom },
      });

      resolved++;
    } else {
      notFound++;
    }
  }

  console.log(`\n[enrich-noms] Done: ${resolved} résolus, ${notFound} non trouvés`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
