import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Measure DB latency
  const dbStart = Date.now();
  await prisma.$queryRaw`SELECT 1`;
  const dbLatencyMs = Date.now() - dbStart;

  // Parallel queries for performance
  const [
    errorsLast24h,
    securityEvents24h,
    loginFailures24h,
    rateLimitHits24h,
    cronLogs7d,
    totalUsers,
    activeUsersLast24h,
    avgResponseTime,
    stripeLastWebhookEntry,
    stripePaymentsFailed,
    stripeDisputes,
    emailBounces,
    emailComplaints,
    totalMarches,
    totalMarchesAttribues,
  ] = await Promise.all([
    // Errors: audit logs with success=false in last 24h
    prisma.auditLog.count({
      where: { success: false, createdAt: { gte: last24h } },
    }),
    // Security events
    prisma.auditLog.count({
      where: {
        action: { in: ['CSRF_REJECTED', 'UPLOAD_REJECTED', 'TWO_FACTOR_FAILED'] },
        createdAt: { gte: last24h },
      },
    }),
    // Login failures
    prisma.auditLog.count({
      where: { action: 'LOGIN_FAILED', createdAt: { gte: last24h } },
    }),
    // Rate limit hits (from CronLog rate-limit entries)
    prisma.cronLog.count({
      where: { jobName: { startsWith: 'rl:' }, executedAt: { gte: last24h } },
    }),
    // Cron job logs last 7 days
    prisma.cronLog.findMany({
      where: { executedAt: { gte: last7d }, jobName: { not: { startsWith: 'rl:' } } },
      orderBy: { executedAt: 'desc' },
      take: 50,
      select: { jobName: true, success: true, executedAt: true, message: true },
    }),
    // Total users
    prisma.user.count(),
    // Active users (logged in last 24h)
    prisma.user.count({ where: { lastLoginAt: { gte: last24h } } }),
    // Average response time from audit logs
    prisma.auditLog.aggregate({
      where: { createdAt: { gte: last24h }, responseTime: { not: null } },
      _avg: { responseTime: true },
    }),
    // Stripe metrics
    prisma.stripeEventLog.findFirst({
      orderBy: { processedAt: 'desc' },
      select: { processedAt: true },
    }),
    prisma.auditLog.count({
      where: { action: 'PAYMENT_FAILED', createdAt: { gte: last30d } },
    }),
    prisma.auditLog.count({
      where: { action: 'DISPUTE_CREATED', createdAt: { gte: last30d } },
    }),
    // Resend metrics
    prisma.auditLog.count({
      where: { action: 'EMAIL_BOUNCED', createdAt: { gte: last30d } },
    }),
    prisma.auditLog.count({
      where: { action: 'EMAIL_COMPLAINT', createdAt: { gte: last30d } },
    }),
    // DB metrics
    prisma.marche.count(),
    prisma.marcheAttribue.count(),
  ]);

  // Calculate uptime from cron success rate (proxy metric)
  const cronTotal = cronLogs7d.length;
  const cronSuccess = cronLogs7d.filter(c => c.success).length;
  const uptimePercent = cronTotal > 0 ? Math.round((cronSuccess / cronTotal) * 10000) / 100 : 100;

  return NextResponse.json({
    timestamp: now.toISOString(),
    errors24h: errorsLast24h,
    securityEvents24h,
    loginFailures24h,
    rateLimitHits24h,
    uptimePercent,
    avgResponseTimeMs: Math.round(avgResponseTime._avg.responseTime || 0),
    totalUsers,
    activeUsersLast24h,
    recentCronJobs: cronLogs7d.slice(0, 20),
    stripeLastWebhook: stripeLastWebhookEntry?.processedAt?.toISOString() || null,
    stripePaymentsFailed,
    stripeDisputes,
    emailBounces,
    emailComplaints,
    dbLatencyMs,
    totalMarches,
    totalMarchesAttribues,
  });
}
