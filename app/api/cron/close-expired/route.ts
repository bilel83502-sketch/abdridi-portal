import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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

  const now = new Date();

  // Ferme les marchés dont la deadline est dépassée et le status est encore OUVERT
  const result = await prisma.marche.updateMany({
    where: {
      status: 'OUVERT',
      deadline: { lt: now },
    },
    data: { status: 'FERME' },
  });

  // Ferme aussi les marchés sans deadline publiés il y a plus de 90 jours
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const resultNoDeadline = await prisma.marche.updateMany({
    where: {
      status: 'OUVERT',
      deadline: null,
      publicationDate: { lt: ninetyDaysAgo },
    },
    data: { status: 'FERME' },
  });

  const summary = {
    closedByDeadline: result.count,
    closedNoDeadline: resultNoDeadline.count,
    total: result.count + resultNoDeadline.count,
    runAt: now.toISOString(),
  };

  console.log('[CLOSE-EXPIRED]', summary);
  return NextResponse.json(summary);
}
