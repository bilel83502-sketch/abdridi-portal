import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { missionUpdateSchema, formatZodErrors } from '@/lib/validators';
import { auditFromSession } from '@/lib/audit';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || (user.role !== 'ADMIN' && user.role !== 'PROSPECTOR')) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const mission = await prisma.mission.findUnique({
    where: { id: params.id },
    include: {
      marche: { select: { id: true, title: true, buyer: true, nature: true, department: true, departmentName: true, deadline: true } },
      documents: {
        orderBy: { createdAt: 'desc' },
        select: { id: true, missionId: true, name: true, type: true, url: true, mimeType: true, size: true, createdAt: true },
      },
      prospects: {
        orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
        select: {
          id: true, company: true, contact: true, phone: true, email: true,
          status: true, note: true, rdvDate: true, devisAmount: true,
          createdAt: true, updatedAt: true, missionId: true,
          _count: { select: { activities: true } },
          activities: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      },
    },
  });

  if (!mission) return NextResponse.json({ error: 'Mission introuvable' }, { status: 404 });

  // Un commercial ne peut ouvrir que ses missions actives assignées — même en
  // connaissant l'identifiant d'une autre mission, il ne doit pas y accéder.
  if (user.role === 'PROSPECTOR' && (mission.status !== 'ACTIVE' || mission.assignedToId !== user.id)) {
    return NextResponse.json({ error: 'Accès refusé — cette mission ne vous est pas assignée' }, { status: 403 });
  }

  return NextResponse.json(mission);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = missionUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodErrors(parsed.error) }, { status: 400 });
  }

  const d = parsed.data;
  const data: any = {};
  if (d.name !== undefined) data.name = d.name.trim();
  if (d.aoReference !== undefined) data.aoReference = d.aoReference?.trim() || null;
  if (d.aoTitle !== undefined) data.aoTitle = d.aoTitle?.trim() || null;
  if (d.deadline !== undefined) data.deadline = d.deadline ? new Date(d.deadline) : null;
  if (d.status !== undefined) data.status = d.status;
  if (d.ficheRecapUrl !== undefined) data.ficheRecapUrl = d.ficheRecapUrl?.trim() || null;
  if (d.ficheRecapName !== undefined) data.ficheRecapName = d.ficheRecapName?.trim() || null;
  if (d.marcheId !== undefined) data.marcheId = d.marcheId || null;
  if (d.assignedToId !== undefined) data.assignedToId = d.assignedToId || null;

  const mission = await prisma.mission.update({ where: { id: params.id }, data });
  auditFromSession(user, req, 'MISSION_UPDATE', 'Mission', params.id, data);

  return NextResponse.json(mission);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  await prisma.mission.delete({ where: { id: params.id } });
  auditFromSession(user, req, 'MISSION_DELETE', 'Mission', params.id);

  return NextResponse.json({ ok: true });
}
