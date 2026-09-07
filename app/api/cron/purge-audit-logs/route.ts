import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: Request) {
  if (!CRON_SECRET) return NextResponse.json({ error: 'CRON_SECRET non configuré' }, { status: 500 });
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Purge audit logs older than 12 months (RGPD Art. 5.1.e — limitation de conservation)
  const deletedLogs = await prisma.auditLog.deleteMany({
    where: { createdAt: { lt: twelveMonthsAgo } },
  });

  // Purge expired verification tokens (> 24h)
  const deletedTokens = await prisma.verificationToken.deleteMany({
    where: { expires: { lt: twentyFourHoursAgo } },
  });

  // Log the purge
  await prisma.cronLog.create({
    data: {
      jobName: 'purge-audit-logs',
      success: true,
      message: `Purged ${deletedLogs.count} audit logs (>12 months) + ${deletedTokens.count} expired tokens`,
    },
  });

  return NextResponse.json({
    ok: true,
    purgedAuditLogs: deletedLogs.count,
    purgedTokens: deletedTokens.count,
  });
}
