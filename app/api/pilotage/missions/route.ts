import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { missionCreateSchema, formatZodErrors } from '@/lib/validators';
import { auditFromSession } from '@/lib/audit';

export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || (user.role !== 'ADMIN' && user.role !== 'PROSPECTOR')) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const missions = await prisma.mission.findMany({
    // Un commercial (PROSPECTOR) ne voit que les missions actives qui lui
    // sont assignées — pas l'ensemble du portefeuille de l'admin.
    where: user.role === 'PROSPECTOR' ? { status: 'ACTIVE', assignedToId: user.id } : undefined,
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { prospects: true } },
      prospects: { select: { status: true, devisAmount: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });

  const result = missions.map(m => {
    const total = m.prospects.length;
    const contacted = m.prospects.filter(p => p.status !== 'A_CONTACTER').length;
    const interested = m.prospects.filter(p => ['INTERESSE', 'VISIO_PLANIFIEE', 'DEVIS_ENVOYE', 'DEVIS_SIGNE'].includes(p.status)).length;
    return {
      id: m.id, name: m.name, aoReference: m.aoReference, aoTitle: m.aoTitle,
      deadline: m.deadline, ficheRecapUrl: m.ficheRecapUrl, ficheRecapName: m.ficheRecapName,
      status: m.status, createdAt: m.createdAt, totalProspects: total,
      contacted, interested, progress: total > 0 ? Math.round((contacted / total) * 100) : 0,
      assignedToId: m.assignedToId, assignedTo: m.assignedTo,
    };
  });

  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = missionCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodErrors(parsed.error) }, { status: 400 });
  }

  const { name, aoReference, aoTitle, deadline, ficheRecapUrl, ficheRecapName, marcheId } = parsed.data;

  const mission = await prisma.mission.create({
    data: {
      name: name.trim(),
      aoReference: aoReference?.trim() || null,
      aoTitle: aoTitle?.trim() || null,
      deadline: deadline ? new Date(deadline) : null,
      ficheRecapUrl: ficheRecapUrl?.trim() || null,
      ficheRecapName: ficheRecapName?.trim() || null,
      marcheId: marcheId || null,
    },
  });

  auditFromSession(user, req, 'MISSION_CREATE', 'Mission', mission.id, { name });

  return NextResponse.json(mission, { status: 201 });
}
