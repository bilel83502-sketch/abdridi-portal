/**
 * Script de synchronisation manuelle France Marchés (PQR).
 * Usage : npx tsx scripts/sync-francemarches.ts [--limit=500]
 *
 * Charge .env.local en local pour DATABASE_URL (loadEnv pattern).
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { PrismaClient } from '@prisma/client';
import { fetchFranceMarchesRecords } from '../lib/francemarches';

function loadEnv() {
  const envLocal = resolve(process.cwd(), '.env.local');
  try {
    const lines = readFileSync(envLocal, 'utf-8').split('\n');
    for (const line of lines) {
      const m =
        line.match(/^([A-Z_][A-Z0-9_]*)="([^"]*)"/) ||
        line.match(/^([A-Z_][A-Z0-9_]*)='([^']*)'/) ||
        line.match(/^([A-Z_][A-Z0-9_]*)=(.+)$/);
      if (m) process.env[m[1]] = m[2];
    }
  } catch {
    // pas de .env.local → on suppose env injectée par le runner (CI/Vercel)
  }
}

loadEnv();

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const limit = parseInt(
    args.find((a) => a.startsWith('--limit='))?.split('=')[1] || '500',
  );

  console.log(`\n🔄 Sync France Marchés (PQR) — limit=${limit}\n`);

  const records = await fetchFranceMarchesRecords({ limit });
  console.log(`📥 ${records.length} AO récupérés depuis France Marchés\n`);

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
            value: record.value,
            deadline: record.deadline,
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
      source: 'FRANCE_MARCHES',
      status: 'OUVERT',
      deadline: { lt: new Date() },
    },
    data: { status: 'FERME' },
  });

  console.log(`\n✅ Sync terminé :`);
  console.log(`   📝 Créés      : ${created}`);
  console.log(`   🔄 Mis à jour : ${updated}`);
  console.log(`   ⏭  Ignorés    : ${skipped}`);
  console.log(`   🔒 Expirés    : ${expired.count}`);

  const total = await prisma.marche.count();
  console.log(`\n📊 Total marchés en base : ${total}\n`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur fatale :', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
