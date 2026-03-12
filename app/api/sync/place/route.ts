import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchPlaceRecords } from '@/lib/place';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Vercel free plan max

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: Request) {
  // Vérification du secret pour les cron jobs Vercel
  if (CRON_SECRET) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
  }

  try {
    const records = await fetchPlaceRecords({ limit: 200 });

    let created = 0;
    let skipped = 0;

    // Process in batches of 50 using $transaction for better performance
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
          })
        );

      try {
        const results = await prisma.$transaction(ops);
        created += results.length;
      } catch (e: any) {
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
            created++;
          } catch {
            skipped++;
          }
        }
      }
    }

    // Marquer les marchés PLACE expirés comme FERME
    const expired = await prisma.marche.updateMany({
      where: {
        source: 'PLACE',
        status: 'OUVERT',
        deadline: { lt: new Date() },
      },
      data: { status: 'FERME' },
    });

    const summary = {
      total: records.length,
      upserted: created,
      skipped,
      expired: expired.count,
      syncedAt: new Date().toISOString(),
    };

    console.log('[PLACE] Sync complete:', summary);
    return NextResponse.json(summary);
  } catch (error: any) {
    console.error('[PLACE] Sync failed:', error);
    return NextResponse.json(
      { error: 'Sync failed', message: error?.message },
      { status: 500 }
    );
  }
}
