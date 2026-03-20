import { NextResponse } from 'next/server';
import { fetchApprochRecords } from '@/lib/approch';

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

  // Domain is parked — return unavailable status
  await fetchApprochRecords();

  return NextResponse.json({
    status: 'unavailable',
    reason: 'Domain parked (approch.fr en vente sur Dovendi)',
    total: 0,
    upserted: 0,
    skipped: 0,
    expired: 0,
    syncedAt: new Date().toISOString(),
  });
}
