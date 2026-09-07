import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + 1);
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [callsThisWeek, visiosPlanned, devisEnvoye, devisSigne] = await Promise.all([
    prisma.prospectActivity.count({
      where: { action: 'APPEL', createdAt: { gte: startOfWeek } },
    }),
    prisma.prospect.count({
      where: { status: 'VISIO_PLANIFIEE' },
    }),
    prisma.prospect.findMany({
      where: { status: 'DEVIS_ENVOYE' },
      select: { devisAmount: true },
    }),
    prisma.prospect.findMany({
      where: { status: 'DEVIS_SIGNE', updatedAt: { gte: startOfMonth } },
      select: { devisAmount: true },
    }),
  ]);

  const devisTotal = devisEnvoye.reduce((sum, p) => sum + (p.devisAmount || 0), 0);
  const caSigneMois = devisSigne.reduce((sum, p) => sum + (p.devisAmount || 0), 0);

  // Pipeline counts
  const pipeline = await prisma.prospect.groupBy({
    by: ['status'],
    _count: true,
  });
  const pipelineMap: Record<string, number> = {};
  pipeline.forEach(p => { pipelineMap[p.status] = p._count; });

  // Weekly chart data — single query with groupBy instead of 12 separate COUNT queries
  const weeklyActivities = await prisma.$queryRaw<{ week_num: number; action: string; result: string | null; cnt: bigint }[]>`
    SELECT
      FLOOR(EXTRACT(DAY FROM ("createdAt" - ${startOfMonth}::timestamp)) / 7)::int AS week_num,
      "action",
      "result",
      COUNT(*)::bigint AS cnt
    FROM "ProspectActivity"
    WHERE "createdAt" >= ${startOfMonth} AND "createdAt" <= ${now}
    GROUP BY week_num, "action", "result"
  `;

  const weeklyData: { week: string; appels: number; rdv: number; signes: number }[] = [];
  for (let w = 0; w < 4; w++) {
    const weekStart = new Date(startOfMonth);
    weekStart.setDate(weekStart.getDate() + w * 7);
    if (weekStart > now) break;

    let appels = 0, rdv = 0, signes = 0;
    for (const row of weeklyActivities) {
      if (Number(row.week_num) !== w) continue;
      if (row.action === 'APPEL') appels += Number(row.cnt);
      if (row.result === 'VISIO_PLANIFIEE') rdv += Number(row.cnt);
      if (row.result === 'DEVIS_SIGNE') signes += Number(row.cnt);
    }
    weeklyData.push({ week: `S${w + 1}`, appels, rdv, signes });
  }

  // Recent activity
  const recentActivity = await prisma.prospectActivity.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      prospect: {
        select: { company: true, mission: { select: { name: true } } },
      },
    },
  });

  const res = NextResponse.json({
    kpis: {
      callsThisWeek,
      visiosPlanned,
      devisEnAttente: devisEnvoye.length,
      devisTotal,
      caSigneMois,
      devisSigneCount: devisSigne.length,
    },
    pipeline: pipelineMap,
    weeklyData,
    recentActivity: recentActivity.map(a => ({
      id: a.id,
      action: a.action,
      result: a.result,
      note: a.note,
      company: a.prospect.company,
      mission: a.prospect.mission.name,
      createdAt: a.createdAt,
    })),
  });
  res.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=15');
  return res;
}
