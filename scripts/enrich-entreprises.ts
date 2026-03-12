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
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
