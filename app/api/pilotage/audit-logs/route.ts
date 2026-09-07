import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');
  const userFilter = searchParams.get('user');
  const resource = searchParams.get('resource');
  const country = searchParams.get('country');
  const period = searchParams.get('period') || '7d';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 50;

  const periodMap: Record<string, number> = { '24h': 1, '7d': 7, '30d': 30 };
  const days = periodMap[period] || 7;
  const since = new Date();
  since.setDate(since.getDate() - days);

  const where: any = { createdAt: { gte: since } };
  if (action) where.action = action;
  if (userFilter) where.userEmail = { contains: userFilter, mode: 'insensitive' };
  if (resource) where.resource = resource;
  if (country) where.country = country;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  // Daily stats for the chart — SQL groupBy instead of loading all rows into memory
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const dailyRaw = await prisma.$queryRaw<{ day: string; success_count: bigint; failure_count: bigint }[]>`
    SELECT
      TO_CHAR("createdAt", 'YYYY-MM-DD') AS day,
      COUNT(*) FILTER (WHERE "success" = true)::bigint AS success_count,
      COUNT(*) FILTER (WHERE "success" = false)::bigint AS failure_count
    FROM "AuditLog"
    WHERE "createdAt" >= ${thirtyDaysAgo}
    GROUP BY day
    ORDER BY day
  `;

  const dailyMap = new Map(dailyRaw.map(r => [r.day, { success: Number(r.success_count), failure: Number(r.failure_count) }]));
  const chartData: { date: string; success: number; failure: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const stats = dailyMap.get(key);
    chartData.push({ date: key, success: stats?.success || 0, failure: stats?.failure || 0 });
  }

  return NextResponse.json({ logs, total, page, pages: Math.ceil(total / limit), chartData });
}
