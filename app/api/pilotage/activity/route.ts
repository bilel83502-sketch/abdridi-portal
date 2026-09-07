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

  const activities = await prisma.prospectActivity.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      prospect: {
        select: { company: true, mission: { select: { name: true } } },
      },
    },
  });

  return NextResponse.json(activities.map(a => ({
    id: a.id,
    action: a.action,
    result: a.result,
    note: a.note,
    company: a.prospect.company,
    mission: a.prospect.mission.name,
    createdAt: a.createdAt,
  })));
}
