import { NextResponse } from 'next/server';
import { withCronLogging } from '@/lib/cronLogger';

export const dynamic = 'force-dynamic';
export const maxDuration = 10;

const CRON_SECRET = process.env.CRON_SECRET;

/**
 * SAFETENDER — Source indisponible
 *
 * safetender.com redirige vers omnikles.com qui n'a pas de listing public.
 * La plateforme est déjà couverte par /api/sync/klekoon.
 * Cette route reste en place mais retourne immédiatement un statut unavailable.
 */
export async function GET(req: Request) {
  if (!CRON_SECRET) {
    return NextResponse.json({ error: 'CRON_SECRET non configuré' }, { status: 500 });
  }
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  return NextResponse.json({
    status: 'unavailable',
    reason:
      'safetender.com redirige vers omnikles.com (fusion). ' +
      'Aucun listing public disponible. Couvert par /api/sync/klekoon.',
    total: 0,
    upserted: 0,
    skipped: 0,
    expired: 0,
    syncedAt: new Date().toISOString(),
  });
}
