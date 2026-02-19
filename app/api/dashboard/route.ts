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

  const [totalOpen, newThisWeek, closingSoon, userAlerts, byNature, recentMarches, topDepartments] = await Promise.all([
    prisma.marche.count({ where: { status: 'OUVERT' } }),
    prisma.marche.count({ where: { publicationDate: { gte: weekAgo }, status: 'OUVERT' } }),
    prisma.marche.count({ where: { deadline: { lte: weekLater, gte: now }, status: 'OUVERT' } }),
    prisma.alert.count({ where: { userId, active: true } }),
    prisma.marche.groupBy({ by: ['nature'], where: { status: 'OUVERT' }, _count: true }),
    prisma.marche.findMany({ where: { status: 'OUVERT' }, orderBy: { publicationDate: 'desc' }, take: 5 }),
    prisma.marche.groupBy({ by: ['department'], where: { status: 'OUVERT' }, _count: true, orderBy: { _count: { department: 'desc' } }, take: 5 }),
  ]);

  return NextResponse.json({
    totalOpen, newThisWeek, closingSoon, userAlerts,
    byNature: byNature.map(b => ({ nature: b.nature, count: b._count })),
    recentMarches,
    topDepartments: topDepartments.map(d => ({ department: d.department, count: d._count })),
  });
}
