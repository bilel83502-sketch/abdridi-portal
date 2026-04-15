import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractSiren, fetchEntreprise, sleep } from '@/lib/sirene';
import { withCronLogging } from '@/lib/cronLogger';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 min max for Vercel

const BATCH_LIMIT = 500;
const DELAY_MS = 250; // 4 req/s, safe under 7/s limit

export async function GET(req: Request) {
  // Protect with CRON_SECRET
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[enrich] Starting entreprise enrichment...');

  // Find all unique SIRENs from MarcheAttribue that haven't been enriched yet
  const marchesWithSiret = await prisma.marcheAttribue.findMany({
    where: {
      titulaireSiret: { not: null },
    },
    select: { titulaireSiret: true },
    distinct: ['titulaireSiret'],
  });

  // Extract unique SIRENs and filter out already-enriched ones
  const sirenSet = new Set<string>();
  for (const m of marchesWithSiret) {
    if (m.titulaireSiret && m.titulaireSiret.length >= 9) {
      sirenSet.add(extractSiren(m.titulaireSiret));
    }
  }

  // Check which SIRENs are already in the Entreprise table
  const existingSirens = await prisma.entreprise.findMany({
    select: { siren: true },
  });
  const existingSet = new Set(existingSirens.map(e => e.siren));

  const sirensToEnrich = Array.from(sirenSet).filter(s => !existingSet.has(s));
  const batch = sirensToEnrich.slice(0, BATCH_LIMIT);

  console.log(`[enrich] ${sirenSet.size} unique SIRENs found, ${existingSet.size} already enriched, ${batch.length} to process`);

  let enriched = 0;
  let errors = 0;

  for (const siren of batch) {
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
        console.log('[enrich] Rate limited, waiting 2s...');
        await sleep(2000);
        // Retry once
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
          }
        } catch {
          errors++;
        }
      } else {
        errors++;
        console.error(`[enrich] Error for SIREN ${siren}:`, err.message);
      }
    }

    await sleep(DELAY_MS);
  }

  console.log(`[enrich] Done: ${enriched} enriched, ${errors} errors, ${sirensToEnrich.length - batch.length} remaining`);

  return NextResponse.json({
    enriched,
    errors,
    remaining: sirensToEnrich.length - batch.length,
    total: sirenSet.size,
  });
}
