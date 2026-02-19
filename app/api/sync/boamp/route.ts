import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchBoampRecords } from '@/lib/boamp';

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
    const records = await fetchBoampRecords({ limit: 1000, daysBack: 30 });

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
        // Count creates vs updates (approximate: if id is new, it's created)
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

    // Marquer les marchés BOAMP expirés comme FERME
    const expired = await prisma.marche.updateMany({
      where: {
        source: 'BOAMP',
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

    console.log('[BOAMP] Sync complete:', summary);
    return NextResponse.json(summary);
  } catch (error: any) {
    console.error('[BOAMP] Sync failed:', error);
    return NextResponse.json(
      { error: 'Sync failed', message: error?.message },
      { status: 500 }
    );
  }
}
