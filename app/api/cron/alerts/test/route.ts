import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { processAlerts } from '../route';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Non autorisé — admin uniquement' }, { status: 403 });
  }

  console.log(`[Cron Alerts Test] Triggered manually by ${session.user.email}`);
  const result = await processAlerts({ dryRun: true });
  return NextResponse.json({ ok: true, dryRun: true, triggeredBy: session.user.email, ...result });
}
