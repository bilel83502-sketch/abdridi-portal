import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchBoampAttribRecords, fetchDecpV3Records, type AttribueRecord } from '@/lib/decp-attribue';
import { upsertAttribueRecords } from '@/lib/upsert-attribue';
import { withCronLogging } from '@/lib/cronLogger';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const CRON_SECRET = process.env.CRON_SECRET;


export async function GET(req: Request) {
  if (!CRON_SECRET) {
    return NextResponse.json({ error: 'CRON_SECRET non configuré' }, { status: 500 });
  }
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  // Use ?source=boamp or ?source=decp to sync one at a time
  // Use ?page=0,1,2... to paginate (each page = 500 records)
  const { searchParams } = new URL(req.url);
  const source = searchParams.get('source') || 'boamp'; // default to boamp (best data)
  const pageNum = parseInt(searchParams.get('page') || '0');
  const batchSize = 500;

  try {
    let records: AttribueRecord[];

    if (source === 'decp') {
      records = await fetchDecpV3Records({ limit: batchSize, monthsBack: 12, startOffset: pageNum * batchSize });
    } else {
      records = await fetchBoampAttribRecords({ limit: batchSize, daysBack: 365, startOffset: pageNum * batchSize });
    }

    const { upserted, dedup, skipped } = await upsertAttribueRecords(records);
    const total = await prisma.marcheAttribue.count();

    const summary = {
      source,
      page: pageNum,
      offsetRange: `${pageNum * batchSize}-${pageNum * batchSize + records.length}`,
      fetched: records.length,
      upserted,
      skipped,
      dedup,
      totalInDb: total,
      syncedAt: new Date().toISOString(),
    };

    console.log('[ATTRIBUE] Sync complete:', summary);
    return NextResponse.json(summary);
  } catch (error: any) {
    console.error('[ATTRIBUE] Sync failed:', error);
    return NextResponse.json(
      { error: 'Sync failed', message: error?.message },
      { status: 500 }
    );
  }
}
