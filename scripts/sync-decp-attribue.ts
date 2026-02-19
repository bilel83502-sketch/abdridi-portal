/**
 * Script de synchronisation manuelle des marchés attribués (DECP V3 + BOAMP Attribution)
 * Usage : npx tsx scripts/sync-decp-attribue.ts [--limit=5000] [--months=12]
 */
import { PrismaClient } from '@prisma/client';
import { fetchAllAttribueRecords } from '../lib/decp-attribue';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const limitArg = args.find((a) => a.startsWith('--limit='));
  const monthsArg = args.find((a) => a.startsWith('--months='));

  const limitPerSource = limitArg ? parseInt(limitArg.split('=')[1]) : 5000;
  const monthsBack = monthsArg ? parseInt(monthsArg.split('=')[1]) : 12;

  console.log(
    `\n🔄 Sync Marchés Attribués — limit=${limitPerSource}/source, months=${monthsBack}\n`
  );

  const records = await fetchAllAttribueRecords({ limitPerSource, monthsBack });
  console.log(`📥 ${records.length} marchés attribués récupérés\n`);

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
            region: record.region,
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
        console.error(`  ⚠ Erreur sur ${record.sourceRef}: ${e?.message}`);
        skipped++;
      }
    }
  }

  console.log(`\n✅ Sync terminé :`);
  console.log(`   📝 Créés      : ${created}`);
  console.log(`   🔄 Mis à jour : ${updated}`);
  console.log(`   ⏭  Ignorés   : ${skipped}`);

  const total = await prisma.marcheAttribue.count();
  console.log(`\n📊 Total marchés attribués en base : ${total}\n`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur fatale :', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
