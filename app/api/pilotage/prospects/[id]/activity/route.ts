import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { prospectActivitySchema, formatZodErrors } from '@/lib/validators';
import { auditFromSession } from '@/lib/audit';
import { parseUserDateTime } from '@/lib/datetime';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || (user.role !== 'ADMIN' && user.role !== 'PROSPECTOR')) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  // Un commercial ne doit consulter l'historique que d'un prospect dont
  // la mission lui est assignée — pas de n'importe quel prospectId deviné.
  if (user.role === 'PROSPECTOR') {
    const prospect = await prisma.prospect.findUnique({
      where: { id: params.id },
      select: { mission: { select: { status: true, assignedToId: true } } },
    });
    if (!prospect) return NextResponse.json({ error: 'Prospect introuvable' }, { status: 404 });
    if (prospect.mission.status !== 'ACTIVE' || prospect.mission.assignedToId !== user.id) {
      return NextResponse.json({ error: 'Accès refusé — mission non assignée' }, { status: 403 });
    }
  }

  const activities = await prisma.prospectActivity.findMany({
    where: { prospectId: params.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return NextResponse.json(activities);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || (user.role !== 'ADMIN' && user.role !== 'PROSPECTOR')) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const prospect = await prisma.prospect.findUnique({
    where: { id: params.id },
    include: { mission: { select: { status: true, assignedToId: true } } },
  });
  if (!prospect) return NextResponse.json({ error: 'Prospect introuvable' }, { status: 404 });
  if (user.role === 'PROSPECTOR' && (prospect.mission.status !== 'ACTIVE' || prospect.mission.assignedToId !== user.id)) {
    return NextResponse.json({ error: 'Accès refusé — mission non assignée' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = prospectActivitySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodErrors(parsed.error) }, { status: 400 });
  }

  const { action, result, note, status, rdvDate, devisAmount } = parsed.data;

  const activity = await prisma.prospectActivity.create({
    data: { prospectId: params.id, action, result: result || null, note: note || null },
  });

  const updateData: any = { lastContactAt: new Date() };
  if (status) updateData.status = status;
  if (rdvDate) updateData.rdvDate = parseUserDateTime(rdvDate);
  if (note) updateData.note = note;
  if (devisAmount !== undefined && devisAmount !== null && devisAmount !== '') {
    const amount = parseFloat(String(devisAmount).replace(',', '.'));
    if (!isNaN(amount) && amount > 0) updateData.devisAmount = amount;
  }

  await prisma.prospect.update({ where: { id: params.id }, data: updateData });
  auditFromSession(user, req, 'PROSPECT_ACTIVITY', 'Prospect', params.id, { action, result });

  return NextResponse.json(activity, { status: 201 });
}
