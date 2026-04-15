import { NextResponse } from 'next/server';
import { enrichSirene } from '@/lib/sirene-enrich';
import { withCronLogging } from '@/lib/cronLogger';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: Request) {
  if (!CRON_SECRET) {
    return NextResponse.json({ error: 'CRON_SECRET non configuré' }, { status: 500 });
  }
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const result = await enrichSirene(200);

    const summary = {
      source: 'SIRENE-ENRICH',
      ...result,
      syncedAt: new Date().toISOString(),
    };

    console.log('[SIRENE] Enrichment complete:', summary);
    return NextResponse.json(summary);
  } catch (error: any) {
    console.error('[SIRENE] Enrichment failed:', error);
    return NextResponse.json({ error: 'Enrichment failed', message: error?.message }, { status: 500 });
  }
}
