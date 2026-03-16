/**
 * Script de synchronisation manuelle TED
 * Usage : npx tsx scripts/sync-ted.ts [--limit=500] [--days=30]
 */
import { PrismaClient } from '@prisma/client';
import { fetchTedRecords } from '../lib/ted';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const limitArg = args.find((a) => a.startsWith('--limit='));
  const daysArg = args.find((a) => a.startsWith('--days='));

  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 5000;
  const daysBack = daysArg ? parseInt(daysArg.split('=')[1]) : 30;

  console.log(`[TED Sync] Fetching up to ${limit} records from the last ${daysBack} days...`);

  const records = await fetchTedRecords({ limit, daysBack });
  console.log(`[TED Sync] Fetched ${records.length} records from TED`);

  let upserted = 0;
  let skipped = 0;

  for (const record of records) {
    if (!record.sourceRef) {
      skipped++;
      continue;
    }

    try {
      await prisma.marche.upsert({
        where: { sourceRef: record.sourceRef },
        update: {
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
        create: record,
      });
      upserted++;
    } catch (e: any) {
      if (e?.code === 'P2002') {
        skipped++;
      } else {
        console.error(`[TED Sync] Error on ${record.sourceRef}:`, e?.message);
        skipped++;
      }
    }
  }

  // Marquer les marchés TED expirés
  const expired = await prisma.marche.updateMany({
    where: {
      source: 'TED',
      status: 'OUVERT',
      deadline: { lt: new Date() },
    },
    data: { status: 'FERME' },
  });

  console.log(`[TED Sync] Done: ${upserted} upserted, ${skipped} skipped, ${expired.count} expired`);
}

main()
  .catch((e) => {
    console.error('[TED Sync] Fatal error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
