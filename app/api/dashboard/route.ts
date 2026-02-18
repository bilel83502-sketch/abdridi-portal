import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [totalOpen, newThisWeek, closingSoon, byNature, byDepartment, recentMarches, userAlerts, userFavorites] = await Promise.all([
    prisma.marche.count({ where: { status: 'OUVERT' } }),
    prisma.marche.count({ where: { publicationDate: { gte: weekAgo } } }),
    prisma.marche.count({ where: { status: 'OUVERT', deadline: { gte: now, lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) } } }),
    prisma.marche.groupBy({ by: ['nature'], where: { status: 'OUVERT' }, _count: true }),
    prisma.marche.groupBy({ by: ['department'], where: { publicationDate: { gte: monthAgo } }, _count: true, orderBy: { _count: { department: 'desc' } }, take: 10 }),
    prisma.marche.findMany({ where: { status: 'OUVERT' }, orderBy: { publicationDate: 'desc' }, take: 5 }),
    prisma.alert.count({ where: { userId: (session.user as any).id, active: true } }),
    prisma.favorite.count({ where: { userId: (session.user as any).id } }),
  ]);

  return NextResponse.json({
    totalOpen, newThisWeek, closingSoon, userAlerts, userFavorites,
    byNature: byNature.map(n => ({ nature: n.nature, count: n._count })),
    topDepartments: byDepartment.map(d => ({ department: d.department, count: d._count })),
    recentMarches,
  });
}
