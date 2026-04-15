import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchDecpRecords } from '@/lib/decp';
import { withCronLogging } from '@/lib/cronLogger';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: Request) {
  // Vérification du secret pour les cron jobs Vercel
  if (!CRON_SECRET) {
    return NextResponse.json({ error: 'CRON_SECRET non configuré' }, { status: 500 });
  }
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const records = await fetchDecpRecords({ limit: 500, monthsBack: 36 });

    let upserted = 0;
    let skipped = 0;

    // Process in batches of 50 using $transaction
    const BATCH_SIZE = 50;
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);
      const ops = batch
        .filter((r) => r.sourceRef)
        .map((record) =>
          prisma.marche.upsert({
            where: { sourceRef: record.sourceRef },
            update: {
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
            create: record,
          })
        );

      try {
        const results = await prisma.$transaction(ops);
        upserted += results.length;
      } catch {
        // Fallback: process individually on batch failure
        for (const record of batch) {
          if (!record.sourceRef) { skipped++; continue; }
          try {
            await prisma.marche.upsert({
              where: { sourceRef: record.sourceRef },
              update: {
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
              create: record,
            });
            upserted++;
          } catch {
            skipped++;
          }
        }
      }
    }

    const summary = {
      total: records.length,
      upserted,
      skipped,
      syncedAt: new Date().toISOString(),
    };

    console.log('[DECP] Sync complete:', summary);
    return NextResponse.json(summary);
  } catch (error: any) {
    console.error('[DECP] Sync failed:', error);
    return NextResponse.json(
      { error: 'Sync failed', message: error?.message },
      { status: 500 }
    );
  }
}
