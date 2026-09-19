import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || (user.role !== 'ADMIN' && user.role !== 'PROSPECTOR')) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const prospects = await prisma.prospect.findMany({
    where: {
      rdvDate: { not: null },
      // Un commercial ne voit que les rendez-vous de ses missions actives assignées.
      ...(user.role === 'PROSPECTOR' ? { mission: { status: 'ACTIVE', assignedToId: user.id } } : {}),
    },
    select: {
      id: true,
      company: true,
      contact: true,
      phone: true,
      note: true,
      status: true,
      rdvDate: true,
      mission: { select: { id: true, name: true } },
    },
    orderBy: { rdvDate: 'asc' },
  });

  return NextResponse.json(prospects.map(p => ({
    id: p.id,
    title: `${p.company} (${p.mission.name})`,
    start: p.rdvDate,
    end: new Date(new Date(p.rdvDate!).getTime() + 60 * 60 * 1000), // 1h duration
    company: p.company,
    contact: p.contact,
    phone: p.phone,
    note: p.note,
    status: p.status,
    missionId: p.mission.id,
    missionName: p.mission.name,
  })));
}
