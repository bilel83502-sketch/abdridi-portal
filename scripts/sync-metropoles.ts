/**
 * Script de synchronisation des marchés attribués des métropoles
 * Usage : npx tsx scripts/sync-metropoles.ts [--limit=5000] [--metro=HDS92,AMP]
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { PrismaClient } from '@prisma/client';
import { METROPOLES, fetchMetropoleBatch, sleep } from '../lib/metropoles-attribue';

function loadEnv() {
  const envLocal = resolve(process.cwd(), '.env.local');
  try {
    const lines = readFileSync(envLocal, 'utf-8').split('\n');
    for (const line of lines) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)="([^"]*)"/) ||
                line.match(/^([A-Z_][A-Z0-9_]*)='([^']*)'/) ||
                line.match(/^([A-Z_][A-Z0-9_]*)=(.+)$/);
      if (m) process.env[m[1]] = m[2];
    }
  } catch {}
}

async function main() {
  loadEnv();

  const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
  });

  try {
    const args = process.argv.slice(2);
    const limitArg = args.find((a) => a.startsWith('--limit='));
    const metroArg = args.find((a) => a.startsWith('--metro='));

    const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 5000;
    const metroFilter = metroArg
      ? metroArg.split('=')[1].split(',').map((s) => s.toUpperCase())
      : null;

    const metros = metroFilter
      ? METROPOLES.filter((m) => metroFilter.includes(m.code))
      : METROPOLES;

    console.log(`\n🔄 Sync Métropoles — limit=${limit}/source`);
    console.log(`   Métropoles : ${metros.map((m) => m.name).join(', ')}\n`);

    let grandTotalCreated = 0;
    let grandTotalUpdated = 0;
    let grandTotalSkipped = 0;

    for (const metro of metros) {
      console.log(`\n📥 [${metro.code}] ${metro.name}...`);

      let records;
      try {
        records = await fetchMetropoleBatch(metro, { limit, startOffset: 0 });
      } catch (err: any) {
        console.error(`   ❌ Erreur fetch ${metro.code}: ${err.message}`);
        continue;
      }

      console.log(`   ${records.length} marchés récupérés`);

      let created = 0;
      let updated = 0;
      let skipped = 0;

      for (const record of records) {
        if (!record.sourceRef) {
          skipped++;
          continue;
        }

        try {
          const existing = await prisma.marcheAttribue.findUnique({
            where: { sourceRef: record.sourceRef },
          });

          if (existing) {
            await prisma.marcheAttribue.update({
              where: { sourceRef: record.sourceRef },
              data: {
                objet: record.objet,
                acheteurNom: record.acheteurNom,
                acheteurSiret: record.acheteurSiret,
                titulaireNom: record.titulaireNom,
                titulaireSiret: record.titulaireSiret,
                titulaireCommune: record.titulaireCommune,
                montant: record.montant,
                dateNotification: record.dateNotification,
                datePublicationDonnees: record.datePublicationDonnees,
                nature: record.nature,
                procedure: record.procedure,
                lieuExecution: record.lieuExecution,
                departement: record.departement,
                departementNom: record.departementNom,
                codeCPV: record.codeCPV,
                labelCPV: record.labelCPV,
                dureeMois: record.dureeMois,
                formePrix: record.formePrix,
              },
            });
            updated++;
          } else {
            await prisma.marcheAttribue.create({ data: record });
            created++;
          }
        } catch (e: any) {
          if (e?.code === 'P2002') {
            skipped++;
          } else {
            console.error(`   ⚠ Erreur sur ${record.sourceRef}: ${e?.message}`);
            skipped++;
          }
        }
      }

      console.log(
        `   ✅ ${metro.code} : créés=${created}, maj=${updated}, ignorés=${skipped}`
      );

      grandTotalCreated += created;
      grandTotalUpdated += updated;
      grandTotalSkipped += skipped;

      // Pause entre les métropoles
      await sleep(500);
    }

    console.log(`\n${'═'.repeat(60)}`);
    console.log(`✅ Sync Métropoles terminé`);
    console.log(`   📝 Créés      : ${grandTotalCreated}`);
    console.log(`   🔄 Mis à jour : ${grandTotalUpdated}`);
    console.log(`   ⏭  Ignorés   : ${grandTotalSkipped}`);

    const total = await prisma.marcheAttribue.count();
    console.log(`\n📊 Total marchés attribués en base : ${total}\n`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error('❌ Erreur fatale :', e);
  process.exit(1);
});
