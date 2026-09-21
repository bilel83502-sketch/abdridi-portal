import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { missionUpdateSchema, formatZodErrors } from '@/lib/validators';
import { auditFromSession } from '@/lib/audit';
import { sendMissionAssignedEmail, sendMissionClosedEmail } from '@/lib/email';

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

const PROSPECTOR_ALLOWED_STATUSES = ['ACTIVE', 'COMPLETED', 'NON_ABOUTIE'];

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || (user.role !== 'ADMIN' && user.role !== 'PROSPECTOR')) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const body = await req.json();

  // Un commercial peut uniquement clôturer une mission qui lui est assignée
  // (Terminée / Non aboutie) — aucun autre champ, aucune autre mission.
  if (user.role === 'PROSPECTOR') {
    const keys = Object.keys(body || {});
    if (keys.length !== 1 || keys[0] !== 'status' || !PROSPECTOR_ALLOWED_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: 'Seul le statut de la mission peut être modifié' }, { status: 403 });
    }
    const m = await prisma.mission.findUnique({ where: { id: params.id }, select: { assignedToId: true, status: true, name: true } });
    if (!m || m.assignedToId !== user.id) {
      return NextResponse.json({ error: 'Accès refusé — mission non assignée' }, { status: 403 });
    }
    if (!PROSPECTOR_ALLOWED_STATUSES.includes(m.status)) {
      return NextResponse.json({ error: 'Mission mise en pause par l\'administrateur' }, { status: 403 });
    }
    if (m.status === body.status) {
      return NextResponse.json(m);
    }
    const updated = await prisma.mission.update({ where: { id: params.id }, data: { status: body.status } });
    auditFromSession(
      user, req,
      body.status === 'ACTIVE' ? 'MISSION_UPDATE' : 'MISSION_CLOSED',
      'Mission', params.id,
      { status: body.status, byName: user.name || user.email },
    );
    if (body.status !== 'ACTIVE') {
      sendMissionClosedEmail({
        missionId: updated.id,
        missionName: updated.name,
        status: body.status,
        byName: user.name || user.email || 'Un commercial',
      }).catch(() => {});
    }
    return NextResponse.json(updated);
  }

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

  // Pour savoir si l'assignation change réellement (et éviter un email
  // à chaque modification de statut ou de date).
  const before = data.assignedToId !== undefined
    ? await prisma.mission.findUnique({ where: { id: params.id }, select: { assignedToId: true } })
    : null;

  const mission = await prisma.mission.update({
    where: { id: params.id },
    data,
    include: {
      assignedTo: { select: { name: true, email: true } },
      _count: { select: { prospects: true } },
    },
  });
  auditFromSession(user, req, 'MISSION_UPDATE', 'Mission', params.id, data);

  // Nouvelle assignation (ou réassignation) → notification au commercial
  if (data.assignedToId && before && before.assignedToId !== data.assignedToId && mission.assignedTo) {
    sendMissionAssignedEmail({
      toEmail: mission.assignedTo.email,
      toName: mission.assignedTo.name,
      missionId: mission.id,
      missionName: mission.name,
      aoTitle: mission.aoTitle,
      aoReference: mission.aoReference,
      deadline: mission.deadline,
      totalProspects: mission._count.prospects,
      assignedBy: user.name || 'AB DRIDI',
    }).catch(() => {});
  }

  const { assignedTo, _count, ...plain } = mission as any;
  return NextResponse.json({ ...plain, assignedTo });
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
