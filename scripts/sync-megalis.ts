/**
 * Script de synchronisation manuelle Mégalis Bretagne
 * Usage : npx tsx scripts/sync-megalis.ts [--limit=200]
 */
import { PrismaClient } from '@prisma/client';
import { fetchMegalisRecords } from '../lib/megalis';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const limit = parseInt(args.find((a) => a.startsWith('--limit='))?.split('=')[1] || '5000');

  console.log(`\n🔄 Sync Mégalis Bretagne — limit=${limit}\n`);

  const records = await fetchMegalisRecords({ limit });
  console.log(`📥 ${records.length} consultations récupérées depuis Mégalis Bretagne\n`);

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

  const expired = await prisma.marche.updateMany({
    where: {
      source: 'MEGALIS',
      status: 'OUVERT',
      deadline: { lt: new Date() },
    },
    data: { status: 'FERME' },
  });

  console.log(`\n✅ Sync terminé :`);
  console.log(`   📝 Créés    : ${created}`);
  console.log(`   🔄 Mis à jour : ${updated}`);
  console.log(`   ⏭  Ignorés  : ${skipped}`);
  console.log(`   🔒 Expirés  : ${expired.count}`);

  const total = await prisma.marche.count();
  console.log(`\n📊 Total marchés en base : ${total}\n`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur fatale :', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
