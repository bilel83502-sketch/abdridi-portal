import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const userId = (session.user as any).id;
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const userRecord = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true, role: true } });
  const isTeam = userRecord?.role === 'ADMIN' || userRecord?.role === 'PROSPECTOR';

  const [totalOpen, newThisWeek, closingSoon, userAlerts, byNature, recentMarches, topDepartments, totalAttribues] = await Promise.all([
    prisma.marche.count({ where: { status: 'OUVERT' } }),
    prisma.marche.count({ where: { publicationDate: { gte: weekAgo }, status: 'OUVERT' } }),
    prisma.marche.count({ where: { deadline: { lte: weekLater, gte: now }, status: 'OUVERT' } }),
    prisma.alert.count({ where: { userId, active: true } }),
    prisma.marche.groupBy({ by: ['nature'], where: { status: 'OUVERT' }, _count: true }),
    prisma.marche.findMany({ where: { status: 'OUVERT', publicationDate: { not: null } }, orderBy: { publicationDate: 'desc' }, take: 5 }),
    prisma.marche.groupBy({ by: ['department'], where: { status: 'OUVERT', department: { notIn: ['00', ''] } }, _count: true, orderBy: { _count: { department: 'desc' } }, take: 5 }),
    prisma.marcheAttribue.count(),
  ]);

  // Daily publication counts for last 30 days + previous 30 days total
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const [dailyCounts, prevPeriod] = await Promise.all([
    prisma.$queryRawUnsafe(`
      SELECT DATE_TRUNC('day', "publicationDate") as day, COUNT(*)::int as count
      FROM "Marche"
      WHERE "publicationDate" >= $1 AND "publicationDate" IS NOT NULL AND status = 'OUVERT'
      GROUP BY DATE_TRUNC('day', "publicationDate")
      ORDER BY day ASC
    `, thirtyDaysAgo) as Promise<{ day: Date; count: number }[]>,
    prisma.$queryRawUnsafe(`
      SELECT COUNT(*)::int as count FROM "Marche"
      WHERE "publicationDate" >= $1 AND "publicationDate" < $2
        AND "publicationDate" IS NOT NULL AND status = 'OUVERT'
    `, sixtyDaysAgo, thirtyDaysAgo) as Promise<{ count: number }[]>,
  ]);
  const previousPeriodTotal = prevPeriod[0]?.count || 0;

  const res = NextResponse.json({
    totalOpen, newThisWeek, closingSoon, userAlerts, totalAttribues,
    userPlan: isTeam ? 'VEILLE' : (userRecord?.plan || 'DECOUVERTE'),
    byNature: byNature.map(b => ({ nature: b.nature, count: b._count })),
    recentMarches,
    topDepartments: topDepartments.map(d => ({ department: d.department, count: d._count })),
    dailyCounts,
    previousPeriodTotal,
  });
  res.headers.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=30');
  return res;
}
