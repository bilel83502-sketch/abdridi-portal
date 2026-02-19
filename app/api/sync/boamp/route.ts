import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchBoampRecords } from '@/lib/boamp';

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
    const records = await fetchBoampRecords({ limit: 200, daysBack: 30 });

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
        // Unique constraint violation — skip silently
        if (e?.code === 'P2002') {
          skipped++;
        } else {
          console.error(`[BOAMP] Error on ${record.sourceRef}:`, e?.message);
          skipped++;
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
      created,
      updated,
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
