/**
 * Script CLI — sync local centraledesmarches.com.
 *
 * Usage :
 *   npx tsx scripts/sync-centraledesmarches.ts                  # run réel, écrit en base
 *   npx tsx scripts/sync-centraledesmarches.ts --limit=10       # max 10 pages
 *   npx tsx scripts/sync-centraledesmarches.ts --debug          # affiche le HTML brut page 1
 *   npx tsx scripts/sync-centraledesmarches.ts --dry-run        # parse sans écrire en base
 *
 * NB : ce script charge .env.local pour disposer de DATABASE_URL.
 */
import 'dotenv/config';
import { config } from 'dotenv';
config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';
import {
  fetchCentraleDesMarchesRecords,
  fetchCentraleDesMarchesRawPage,
} from '../lib/centraledesmarches';

const args = process.argv.slice(2);
const limit = Number(
  (args.find((a) => a.startsWith('--limit=')) || '--limit=10').split('=')[1],
);
const debug = args.includes('--debug');
const dryRun = args.includes('--dry-run');

async function main() {
  if (debug) {
    console.log('▶ Mode DEBUG — récupération HTML brut de la page 1 (keywords=transport)…');
    const html = await fetchCentraleDesMarchesRawPage({ keywords: 'transport', status: 2 }, 1);
    console.log('Taille HTML :', html.length, 'caractères');
    console.log('───── Extrait (5000 premiers caractères) ─────');
    console.log(html.substring(0, 5000));
    console.log('───── Recherche sélecteurs candidats ─────');
    // Heuristique : chercher les classes les plus fréquentes contenant "annonce", "av-", "market"
    const matches = html.match(/class="[^"]*(?:annonce|av-|market|consultation|marche-public)[^"]*"/g) || [];
    const freq: Record<string, number> = {};
    matches.forEach((m) => {
      freq[m] = (freq[m] || 0) + 1;
    });
    console.log(
      Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([k, v]) => `${v.toString().padStart(4, ' ')}  ${k}`)
        .join('\n'),
    );
    process.exit(0);
  }

  console.log(`▶ Sync centraledesmarches.com (limit=${limit} pages, dryRun=${dryRun})…`);
  const records = await fetchCentraleDesMarchesRecords({
    keywords: 'transport',
    status: 2,
    maxPages: limit,
  });
  console.log(`✓ ${records.length} AO transport récupérés.`);

  if (dryRun) {
    console.log('───── Aperçu (5 premiers) ─────');
    console.log(JSON.stringify(records.slice(0, 5), null, 2));
    process.exit(0);
  }

  const prisma = new PrismaClient();
  let upserted = 0;
  let skipped = 0;

  for (const r of records) {
    if (!r.sourceRef) {
      skipped++;
      continue;
    }
    try {
      await prisma.marche.upsert({
        where: { sourceRef: r.sourceRef },
        update: {
          title: r.title,
          buyer: r.buyer,
          nature: r.nature,
          department: r.department,
          departmentName: r.departmentName,
          region: r.region,
          deadline: r.deadline,
          publicationDate: r.publicationDate,
          cpvCode: r.cpvCode,
          cpvLabel: r.cpvLabel,
          documents: r.detailUrl
            ? [{ name: 'Voir sur Centrale des Marchés', url: r.detailUrl, type: 'link' }]
            : undefined,
        },
        create: {
          title: r.title,
          buyer: r.buyer,
          nature: r.nature,
          department: r.department,
          departmentName: r.departmentName,
          region: r.region,
          deadline: r.deadline,
          publicationDate: r.publicationDate,
          source: 'CENTRALE_DES_MARCHES',
          sourceRef: r.sourceRef,
          cpvCode: r.cpvCode,
          cpvLabel: r.cpvLabel,
          documents: r.detailUrl
            ? [{ name: 'Voir sur Centrale des Marchés', url: r.detailUrl, type: 'link' }]
            : undefined,
        },
      });
      upserted++;
    } catch (e: any) {
      console.warn('skipped:', r.sourceRef, e?.message);
      skipped++;
    }
  }

  console.log(`✓ Sync terminée — upserted ${upserted}, skipped ${skipped}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ Sync échouée :', e);
  process.exit(1);
});
