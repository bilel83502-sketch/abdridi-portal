import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { prospectUpdateSchema, formatZodErrors } from '@/lib/validators';
import { auditFromSession } from '@/lib/audit';

async function checkAccess(prospectId: string, userRole: string) {
  const prospect = await prisma.prospect.findUnique({
    where: { id: prospectId },
    include: { mission: { select: { status: true } } },
  });
  if (!prospect) return { ok: false as const, status: 404, error: 'Prospect introuvable' };
  if (userRole === 'PROSPECTOR' && prospect.mission.status !== 'ACTIVE') {
    return { ok: false as const, status: 403, error: 'Accès refusé — mission non active' };
  }
  return { ok: true as const, prospect };
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || (user.role !== 'ADMIN' && user.role !== 'PROSPECTOR')) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const access = await checkAccess(params.id, user.role);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

  const body = await req.json();
  const parsed = prospectUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodErrors(parsed.error) }, { status: 400 });
  }

  const d = parsed.data;
  const data: any = {};
  if (d.status !== undefined) data.status = d.status;
  if (d.note !== undefined) data.note = d.note;
  if (d.rdvDate !== undefined) data.rdvDate = d.rdvDate ? new Date(d.rdvDate) : null;
  if (d.devisAmount !== undefined) data.devisAmount = d.devisAmount ? parseFloat(String(d.devisAmount)) : null;
  if (d.contact !== undefined) data.contact = d.contact;
  if (d.phone !== undefined) data.phone = d.phone;
  if (d.email !== undefined) data.email = d.email;
  if (d.lastContactAt !== undefined) data.lastContactAt = d.lastContactAt ? new Date(d.lastContactAt) : new Date();

  const prospect = await prisma.prospect.update({ where: { id: params.id }, data });
  auditFromSession(user, req, 'PROSPECT_UPDATE', 'Prospect', params.id, { status: d.status });

  return NextResponse.json(prospect);
}
