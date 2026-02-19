/**
 * Script de synchronisation manuelle DECP
 * Usage : npx tsx scripts/sync-decp.ts [--limit=500] [--months=6]
 */
import { PrismaClient } from '@prisma/client';
import { fetchDecpRecords } from '../lib/decp';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const limitArg = args.find((a) => a.startsWith('--limit='));
  const monthsArg = args.find((a) => a.startsWith('--months='));

  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 500;
  const monthsBack = monthsArg ? parseInt(monthsArg.split('=')[1]) : 6;

  console.log(`\n🔄 Sync DECP — limit=${limit}, monthsBack=${monthsBack}\n`);

  const records = await fetchDecpRecords({ limit, monthsBack });
  console.log(`📥 ${records.length} marchés récupérés depuis l'API DECP\n`);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const record of records) {
    if (!record.sourceRef) {
      skipped++;
      continue;
    }

    try {
      const existing = await prisma.marche.findUnique({
        where: { sourceRef: record.sourceRef },
      });

      if (existing) {
        await prisma.marche.update({
          where: { sourceRef: record.sourceRef },
          data: {
            title: record.title,
            buyer: record.buyer,
            nature: record.nature,
            department: record.department,
            departmentName: record.departmentName,
            region: record.region,
            value: record.value,
            deadline: record.deadline,
            publicationDate: record.publicationDate,
            procedureType: record.procedureType,
            cpvCode: record.cpvCode,
            cpvLabel: record.cpvLabel,
            lots: record.lots,
            duration: record.duration,
          },
        });
        updated++;
      } else {
        await prisma.marche.create({ data: record });
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

  console.log(`\n✅ Sync DECP terminé :`);
  console.log(`   📝 Créés      : ${created}`);
  console.log(`   🔄 Mis à jour : ${updated}`);
  console.log(`   ⏭  Ignorés   : ${skipped}`);

  const total = await prisma.marche.count();
  const decpCount = await prisma.marche.count({ where: { source: 'DECP' } });
  console.log(`\n📊 Total marchés en base : ${total} (dont ${decpCount} DECP)\n`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur fatale :', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
